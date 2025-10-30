using Backend.Models;
using Razorpay.Api;

namespace Backend.Services;

public interface IPaymentService
{
    Task<Order> CreateOrderAsync(User user, int amountInPaise, string? planId, string? planName, string? currency);
    Task VerifyPaymentAsync(User user, string? orderId, string paymentId, string? signature);
}
