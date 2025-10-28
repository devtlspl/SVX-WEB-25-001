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

    public Task<Order> CreateOrderAsync(User user, int amountInPaise)
    {
        var amount = amountInPaise <= 0 ? _settings.DefaultAmountInPaise : amountInPaise;

        var options = new Dictionary<string, object>
        {
            { "amount", amount },
            { "currency", _settings.Currency },
            { "receipt", $"rcpt_{Guid.NewGuid():N}" },
            { "payment_capture", 1 }
        };

        var order = _razorpayClient.Order.Create(options);
        return Task.FromResult(order);
    }

    public async Task VerifyPaymentAsync(User user, string? orderId, string paymentId, string? signature)
    {
        if (string.IsNullOrWhiteSpace(paymentId))
        {
            throw new InvalidOperationException("Missing payment verification parameters.");
        }

        if (!string.IsNullOrWhiteSpace(orderId) && !string.IsNullOrWhiteSpace(signature))
        {
            var attributes = new Dictionary<string, string>
            {
                { "razorpay_order_id", orderId },
                { "razorpay_payment_id", paymentId },
                { "razorpay_signature", signature }
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
                throw new InvalidOperationException("Payment does not correspond to the supplied order.");
            }

            orderId ??= paymentOrderId;
        }

        user.IsSubscribed = true;
        user.SubscriptionId = paymentId;
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();
    }
}
