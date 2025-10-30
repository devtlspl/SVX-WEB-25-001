using System;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService, AppDbContext dbContext)
    {
        _authService = authService;
        _dbContext = dbContext;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var user = await _authService.RegisterAsync(new RegisterUserRequest(
                request.Name,
                request.Email,
                request.PhoneNumber,
                request.Password,
                request.GovernmentIdType,
                request.GovernmentIdNumber,
                request.GovernmentDocumentUrl,
                request.AcceptTerms));

            return Ok(UserResponse.FromUser(user));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("admin/login")]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var (user, token) = await _authService.AdminLoginAsync(request.Email, request.Password);
            return Ok(new LoginResponse(token, UserResponse.FromUser(user)));
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("login/request-otp")]
    public async Task<IActionResult> RequestOtp([FromBody] RequestOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var result = await _authService.RequestLoginOtpAsync(request.PhoneNumber, request.Password);
            return Ok(new
            {
                message = $"OTP sent to {result.MaskedPhoneNumber}",
                expiresAt = result.ExpiresAt,
                isActive = result.IsRegistrationComplete,
                debugCode = result.DebugCode
            });
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("login/verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var (user, token) = await _authService.VerifyLoginOtpAsync(request.PhoneNumber, request.Code);
            return Ok(new LoginResponse(token, UserResponse.FromUser(user)));
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                     User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null || !Guid.TryParse(userId, out var parsedId))
        {
            return Unauthorized();
        }

        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == parsedId);
        if (user is null)
        {
            return NotFound();
        }

        return Ok(UserResponse.FromUser(user));
    }

    public class RegisterRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string GovernmentIdType { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string GovernmentIdNumber { get; set; } = string.Empty;

        [MaxLength(256)]
        public string? GovernmentDocumentUrl { get; set; }

        public bool AcceptTerms { get; set; }
    }

    public class AdminLoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RequestOtpRequest
    {
        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class VerifyOtpRequest
    {
        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(6)]
        public string Code { get; set; } = string.Empty;
    }

    public record LoginResponse(string Token, UserResponse User);

    public record UserResponse(
        Guid Id,
        string Name,
        string Email,
        string PhoneNumber,
        bool IsSubscribed,
        bool IsRegistrationComplete,
        bool KycVerified,
        string? SubscriptionId,
        DateTime? PaymentVerifiedAt,
        string? ActivePlanId,
        string? ActivePlanName,
        decimal? ActivePlanAmount,
        string? ActivePlanCurrency,
        string? GovernmentIdType,
        string? GovernmentIdNumber,
        string? GovernmentDocumentUrl,
        bool IsAdmin)
    {
        public static UserResponse FromUser(User user) =>
            new(
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.IsSubscribed,
                user.IsRegistrationComplete,
                user.KycVerified,
                user.SubscriptionId,
                user.PaymentVerifiedAt,
                user.ActivePlanId,
                user.ActivePlanName,
                user.ActivePlanAmount,
                user.ActivePlanCurrency,
                user.GovernmentIdType,
                user.GovernmentIdNumber,
                user.GovernmentDocumentUrl,
                user.IsAdmin);
    }
}
