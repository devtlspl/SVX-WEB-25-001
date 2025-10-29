using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Backend.Serialization;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPaymentService _paymentService;

    public PaymentController(AppDbContext dbContext, IPaymentService paymentService)
    {
        _dbContext = dbContext;
        _paymentService = paymentService;
    }

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        var order = await _paymentService.CreateOrderAsync(user, request.AmountInPaise ?? 0);
        return Ok(new
        {
            orderId = order["id"],
            amount = order["amount"],
            currency = order["currency"],
            receipt = order["receipt"]
        });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyPaymentRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.PaymentId))
        {
            return BadRequest(new { message = "Payment id is required." });
        }

        try
        {
            await _paymentService.VerifyPaymentAsync(user, request.OrderId, request.PaymentId, request.Signature);
            user.IsRegistrationComplete = true;
            user.PaymentVerifiedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Subscription activated." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public IActionResult Webhook([FromBody] RazorpayWebhookPayload payload)
    {
        // Placeholder for Razorpay webhook handling. Add signature validation and state transitions as needed.
        return Ok(new { message = "Webhook received." });
    }

    private async Task<Backend.Models.User?> GetCurrentUserAsync()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId);
    }

    public class CreateOrderRequest
    {
        public int? AmountInPaise { get; set; }
    }

    public class VerifyPaymentRequest
    {
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? OrderId { get; set; }

        [JsonConverter(typeof(FlexibleStringConverter))]
        public string PaymentId { get; set; } = string.Empty;

        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Signature { get; set; }
    }

    public class RazorpayWebhookPayload
    {
        public string? Event { get; set; }
        public dynamic? Payload { get; set; }
    }
}
