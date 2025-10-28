using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Razorpay.Api;

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

    public async Task VerifyPaymentAsync(User user, string orderId, string paymentId, string signature)
    {
        var generatedSignature = GenerateSignature($"{orderId}|{paymentId}", _settings.KeySecret);
        if (!CryptographicEquals(generatedSignature, signature))
        {
            throw new InvalidOperationException("Invalid payment signature.");
        }

        user.IsSubscribed = true;
        user.SubscriptionId = paymentId;
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();
    }

    private static string GenerateSignature(string payload, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static bool CryptographicEquals(string a, string b)
    {
        if (a.Length != b.Length)
        {
            return false;
        }

        var result = 0;
        for (var i = 0; i < a.Length; i++)
        {
            result |= a[i] ^ b[i];
        }

        return result == 0;
    }
}
