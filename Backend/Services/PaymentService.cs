using System;
using System.Collections.Generic;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Razorpay.Api;
using Razorpay.Api.Errors;

namespace Backend.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _dbContext;
    private readonly RazorpayClient _razorpayClient;
    private readonly RazorpaySettings _settings;

    public PaymentService(AppDbContext dbContext, RazorpayClient razorpayClient, IOptions<RazorpaySettings> options)
    {
        _dbContext = dbContext;
        _razorpayClient = razorpayClient;
        _settings = options.Value;
    }

    public async Task<Order> CreateOrderAsync(User user, int amountInPaise, string? planId, string? planName, string? currency)
    {
        var amount = amountInPaise <= 0 ? _settings.DefaultAmountInPaise : amountInPaise;
        var resolvedCurrency = string.IsNullOrWhiteSpace(currency) ? _settings.Currency : currency!;

        var options = new Dictionary<string, object>
        {
            { "amount", amount },
            { "currency", resolvedCurrency },
            { "receipt", $"rcpt_{Guid.NewGuid():N}" },
            { "payment_capture", 1 }
        };

        var order = _razorpayClient.Order.Create(options);

        user.PendingOrderId = order["id"]?.ToString();
        user.PendingPlanId = planId;
        user.PendingPlanName = planName;
        user.PendingPlanAmount = amount / 100m;
        user.PendingPlanCurrency = resolvedCurrency;
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();

        return order;
    }

    public async Task VerifyPaymentAsync(User user, string? orderId, string paymentId, string? signature)
    {
        if (string.IsNullOrWhiteSpace(paymentId))
        {
            throw new InvalidOperationException("Missing payment verification parameters.");
        }

        var storedOrderId = user.PendingOrderId;
        if (string.IsNullOrWhiteSpace(orderId) || orderId is "[]" or "\"\"" or "null")
        {
            orderId = storedOrderId;
        }

        if (!string.IsNullOrWhiteSpace(orderId) && !string.IsNullOrWhiteSpace(signature))
        {
            var attributes = new Dictionary<string, string>
            {
                { "razorpay_order_id", orderId! },
                { "razorpay_payment_id", paymentId },
                { "razorpay_signature", signature! }
            };

            try
            {
                Utils.verifyPaymentSignature(attributes);
            }
            catch (SignatureVerificationError ex)
            {
                throw new InvalidOperationException("Invalid payment signature.", ex);
            }
        }
        else
        {
            Payment payment;
            try
            {
                payment = _razorpayClient.Payment.Fetch(paymentId);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Could not fetch payment details from Razorpay.", ex);
            }

            var status = payment["status"]?.ToString();
            if (string.Equals(status, "authorized", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var captureOptions = new Dictionary<string, object>
                    {
                        { "amount", payment["amount"] },
                        { "currency", payment["currency"] ?? _settings.Currency }
                    };
                    payment = payment.Capture(captureOptions);
                    status = payment["status"]?.ToString();
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException("Payment is authorized but could not be captured automatically.", ex);
                }
            }

            if (!string.Equals(status, "captured", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Payment is not completed. Current status: {status ?? "unknown"}.");
            }

            var paymentOrderId = payment["order_id"]?.ToString();
            if (!string.IsNullOrWhiteSpace(orderId) &&
                !string.Equals(paymentOrderId, orderId, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(storedOrderId))
                {
                    orderId = storedOrderId;
                }
                else if (!string.IsNullOrWhiteSpace(paymentOrderId))
                {
                    orderId = paymentOrderId;
                }
                else
                {
                    throw new InvalidOperationException("Payment does not correspond to the supplied order.");
                }
            }
            else
            {
                orderId ??= paymentOrderId;
            }
        }

        user.IsSubscribed = true;
        user.SubscriptionId = paymentId;
        user.PendingOrderId = null;

        var resolvedPlanId = user.PendingPlanId ?? user.ActivePlanId;
        Plan? plan = null;
        if (!string.IsNullOrWhiteSpace(resolvedPlanId))
        {
            plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == resolvedPlanId);
        }

        var activePlanId = resolvedPlanId ?? plan?.Id;
        var activePlanName = user.PendingPlanName ?? user.ActivePlanName ?? "Growth";
        var activePlanAmount = user.PendingPlanAmount ?? user.ActivePlanAmount ?? plan?.Price ?? (_settings.DefaultAmountInPaise / 100m);
        var activePlanCurrency = user.PendingPlanCurrency ?? user.ActivePlanCurrency ?? plan?.Currency ?? _settings.Currency;

        var invoiceAmount = Math.Round(activePlanAmount, 2, MidpointRounding.AwayFromZero);

        var invoice = new Backend.Models.Invoice
        {
            UserId = user.Id,
            PlanId = activePlanId,
            PlanName = activePlanName,
            Amount = invoiceAmount,
            Currency = activePlanCurrency,
            PaymentId = paymentId,
            InvoiceNumber = GenerateInvoiceNumber(),
            IssuedAt = DateTime.UtcNow
        };

        user.ActivePlanId = activePlanId;
        user.ActivePlanName = activePlanName;
        user.ActivePlanAmount = invoiceAmount;
        user.ActivePlanCurrency = activePlanCurrency;
        user.PendingPlanId = null;
        user.PendingPlanName = null;
        user.PendingPlanAmount = null;
        user.PendingPlanCurrency = null;

        var activeHistories = await _dbContext.UserPlanHistories
            .Where(history => history.UserId == user.Id && history.Status == "active")
            .ToListAsync();

        foreach (var history in activeHistories)
        {
            history.Status = "ended";
            history.CancelledAt = DateTime.UtcNow;
        }

        if (!string.IsNullOrWhiteSpace(activePlanId))
        {
            _dbContext.UserPlanHistories.Add(new UserPlanHistory
            {
                UserId = user.Id,
                PlanId = activePlanId!,
                Status = "active",
                Amount = invoiceAmount,
                Currency = activePlanCurrency,
                SubscribedAt = DateTime.UtcNow,
                Notes = $"Payment verified via Razorpay payment {paymentId}."
            });
        }

        _dbContext.Invoices.Add(invoice);
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();
    }

    private static string GenerateInvoiceNumber()
    {
        var timestamp = DateTime.UtcNow;
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        return $"INV-{timestamp:yyyyMMdd}-{suffix}";
    }
}
