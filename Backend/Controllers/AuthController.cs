using System;
using System.ComponentModel.DataAnnotations;
using Backend.Models;
using Backend.Services;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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
            var user = await _authService.RegisterAsync(request.Name, request.Email, request.Password);
            return Ok(UserResponse.FromUser(user));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var (user, token) = await _authService.LoginAsync(request.Email, request.Password);
            return Ok(new LoginResponse
            {
                Token = token,
                User = UserResponse.FromUser(user)
            });
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
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public required string Token { get; set; }
        public required UserResponse User { get; set; }
    }

    public record UserResponse(Guid Id, string Name, string Email, bool IsSubscribed, string? SubscriptionId)
    {
        public static UserResponse FromUser(User user) =>
            new(user.Id, user.Name, user.Email, user.IsSubscribed, user.SubscriptionId);
    }
}
