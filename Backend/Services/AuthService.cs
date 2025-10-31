using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Backend.Data;
using Backend.Models;
using Backend.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend.Services;

public class AuthService : IAuthService
{
    private const string AdminRoleId = "admin";
    private const string DefaultUserRoleId = "user";

    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IOtpCodeHasher _otpCodeHasher;
    private readonly OtpSettings _otpSettings;
    private readonly ILogger<AuthService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        AppDbContext dbContext,
        IPasswordHasher<User> passwordHasher,
        IJwtService jwtService,
        IOtpCodeHasher otpCodeHasher,
        IOptions<OtpSettings> otpOptions,
        ILogger<AuthService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _otpCodeHasher = otpCodeHasher;
        _otpSettings = otpOptions.Value;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<User> RegisterAsync(RegisterUserRequest request)
    {
        if (!request.AcceptTerms)
        {
            throw new InvalidOperationException("Terms and conditions must be accepted.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedPhone = NormalizePhone(request.PhoneNumber);

        var emailExists = await _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail);
        if (emailExists)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var phoneExists = await _dbContext.Users.AnyAsync(u => u.PhoneNumber == normalizedPhone);
        if (phoneExists)
        {
            throw new InvalidOperationException("User with this mobile number already exists.");
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = normalizedEmail,
            PhoneNumber = normalizedPhone,
            GovernmentIdType = request.GovernmentIdType.Trim(),
            GovernmentIdNumber = request.GovernmentIdNumber.Trim(),
            GovernmentDocumentUrl = string.IsNullOrWhiteSpace(request.GovernmentDocumentUrl) ? null : request.GovernmentDocumentUrl.Trim(),
            IsSubscribed = false,
            IsRegistrationComplete = false,
            KycVerified = true,
            IsAdmin = false,
            TermsAcceptedAt = DateTime.UtcNow,
            RiskPolicyAcceptedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        await AssignRoleIfMissingAsync(user.Id, DefaultUserRoleId);

        return user;
    }

    public async Task<(User user, string token)> AdminLoginAsync(string email, string password)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail && u.IsAdmin);

        if (user is null)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        await AssignRoleIfMissingAsync(user.Id, AdminRoleId);

        var sessionId = Guid.NewGuid().ToString("N");
        user.CurrentSessionId = sessionId;
        await _dbContext.SaveChangesAsync();

        await RegisterSessionAsync(user.Id, sessionId, "admin");

        var roles = await GetRoleNamesAsync(user.Id);
        var token = _jwtService.GenerateToken(user, sessionId, roles);
        return (user, token);
    }

    public async Task<OtpDispatchResult> RequestLoginOtpAsync(string phoneNumber, string password)
    {
        var normalizedPhone = NormalizePhone(phoneNumber);
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.PhoneNumber == normalizedPhone && !u.IsAdmin);

        if (user is null)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        var activeOtps = await _dbContext.UserOtps
            .Where(o => o.UserId == user.Id && !o.Consumed && o.Purpose == "login")
            .ToListAsync();

        foreach (var otp in activeOtps)
        {
            otp.Consumed = true;
        }

        var code = GenerateOtpCode();
        var otpLifetime = TimeSpan.FromMinutes(Math.Clamp(_otpSettings.LifetimeMinutes, 1, 30));
        var expiresAt = DateTime.UtcNow.Add(otpLifetime);
        var hashedCode = _otpCodeHasher.HashCode(code);

        var otpEntity = new UserOtp
        {
            UserId = user.Id,
            CodeHash = hashedCode.Hash,
            Salt = hashedCode.Salt,
            ExpiresAt = expiresAt,
            Purpose = "login",
            Consumed = false
        };

        _dbContext.UserOtps.Add(otpEntity);
        await _dbContext.SaveChangesAsync();

        var maskedPhone = MaskPhone(normalizedPhone);
        var debugCode = _otpSettings.ExposeCodesInResponses ? code : null;
        if (debugCode is not null)
        {
            _logger.LogWarning("OTP code exposed via API for user {UserId}. This should only be enabled in development environments.", user.Id);
        }
        else
        {
            _logger.LogInformation("OTP requested for user {UserId} with masked phone {MaskedPhone}.", user.Id, maskedPhone);
        }

        return new OtpDispatchResult(maskedPhone, expiresAt, user.IsRegistrationComplete && user.IsSubscribed, debugCode);
    }

    public async Task<(User user, string token)> VerifyLoginOtpAsync(string phoneNumber, string code)
    {
        var normalizedPhone = NormalizePhone(phoneNumber);
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.PhoneNumber == normalizedPhone && !u.IsAdmin);

        if (user is null)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        var otp = await _dbContext.UserOtps
            .Where(o => o.UserId == user.Id && !o.Consumed && o.Purpose == "login")
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (otp is null)
        {
            throw new InvalidOperationException("No pending OTP. Please request a new one.");
        }

        var normalizedCode = code.Trim();
        if (string.IsNullOrWhiteSpace(otp.CodeHash) || string.IsNullOrWhiteSpace(otp.Salt))
        {
            otp.Consumed = true;
            await _dbContext.SaveChangesAsync();
            throw new InvalidOperationException("OTP has expired. Request a new code.");
        }

        if (DateTime.UtcNow > otp.ExpiresAt)
        {
            otp.Consumed = true;
            await _dbContext.SaveChangesAsync();
            throw new InvalidOperationException("OTP has expired. Request a new code.");
        }

        otp.AttemptCount += 1;
        var maxAttempts = Math.Clamp(_otpSettings.MaxVerificationAttempts, 1, 10);

        if (!_otpCodeHasher.VerifyCode(normalizedCode, otp.CodeHash, otp.Salt))
        {
            if (otp.AttemptCount >= maxAttempts)
            {
                otp.Consumed = true;
            }
            await _dbContext.SaveChangesAsync();
            throw new InvalidOperationException("Invalid OTP code.");
        }

        otp.Consumed = true;
        var sessionId = Guid.NewGuid().ToString("N");
        user.CurrentSessionId = sessionId;

        await AssignRoleIfMissingAsync(user.Id, DefaultUserRoleId);

        await _dbContext.SaveChangesAsync();

        await RegisterSessionAsync(user.Id, sessionId, "otp-login");

        var roles = await GetRoleNamesAsync(user.Id);
        var token = _jwtService.GenerateToken(user, sessionId, roles);
        return (user, token);
    }

    private static string NormalizePhone(string phoneNumber)
    {
        return phoneNumber.Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .Replace("+", string.Empty)
            .Trim();
    }

    private static string MaskPhone(string normalizedPhone)
    {
        if (normalizedPhone.Length <= 4)
        {
            return new string('*', normalizedPhone.Length);
        }

        var lastFour = normalizedPhone[^4..];
        return new string('*', normalizedPhone.Length - 4) + lastFour;
    }

    private static string GenerateOtpCode()
    {
        var bytes = RandomNumberGenerator.GetBytes(4);
        var value = BitConverter.ToUInt32(bytes, 0) % 1000000;
        return value.ToString("D6");
    }

    private async Task AssignRoleIfMissingAsync(Guid userId, string roleId)
    {
        if (string.IsNullOrWhiteSpace(roleId))
        {
            return;
        }

        roleId = roleId.Trim().ToLowerInvariant();

        var roleExists = await _dbContext.Roles.AnyAsync(r => r.Id == roleId);
        if (!roleExists)
        {
            _logger.LogWarning("Attempted to assign unknown role '{RoleId}' to user {UserId}.", roleId, userId);
            return;
        }

        var alreadyAssigned = await _dbContext.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
        if (alreadyAssigned)
        {
            return;
        }

        _dbContext.UserRoles.Add(new UserRole
        {
            UserId = userId,
            RoleId = roleId,
            GrantedBy = "system"
        });

        await _dbContext.SaveChangesAsync();
    }

    private async Task<IReadOnlyList<string>> GetRoleNamesAsync(Guid userId)
    {
        var roles = await _dbContext.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => new { ur.RoleId, RoleName = ur.Role.Name })
            .ToListAsync();

        return roles
            .Select(r => string.IsNullOrWhiteSpace(r.RoleName) ? r.RoleId : r.RoleName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private async Task RegisterSessionAsync(Guid userId, string sessionId, string loginType)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var ipAddress = GetClientIp(httpContext);
            var userAgent = httpContext?.Request.Headers.UserAgent.ToString();
            var deviceSignature = ComputeDeviceSignature(ipAddress, userAgent);
            var deviceName = ParseDeviceName(userAgent);

            var existingSessions = await _dbContext.UserSessions
                .Where(session => session.UserId == userId && session.IsActive)
                .ToListAsync();

            foreach (var session in existingSessions.Where(session => string.Equals(session.SessionId, sessionId, StringComparison.OrdinalIgnoreCase)))
            {
                session.IsActive = false;
                session.TerminatedBy = "system-replaced";
                session.EndedAt = DateTime.UtcNow;
            }

            var userSession = new UserSession
            {
                UserId = userId,
                SessionId = sessionId,
                LoginType = loginType,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                DeviceSignature = deviceSignature,
                DeviceName = deviceName,
                CreatedAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow,
                IsActive = true
            };

            _dbContext.UserSessions.Add(userSession);
            await _dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register session for user {UserId}.", userId);
        }
    }

    private static string? GetClientIp(HttpContext? context)
    {
        if (context is null)
        {
            return null;
        }

        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded) && !string.IsNullOrWhiteSpace(forwarded))
        {
            var first = forwarded.ToString().Split(',').FirstOrDefault();
            return string.IsNullOrWhiteSpace(first) ? null : first.Trim();
        }

        var remoteIp = context.Connection.RemoteIpAddress;
        return remoteIp is null ? null : remoteIp.ToString();
    }

    private static string? ParseDeviceName(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return null;
        }

        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase))
        {
            return "Windows";
        }

        if (userAgent.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase))
        {
            return "macOS";
        }

        if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase))
        {
            return "Android";
        }

        if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase))
        {
            return "iOS";
        }

        if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase))
        {
            return "Linux";
        }

        return "Unknown";
    }

    private static string? ComputeDeviceSignature(string? ipAddress, string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(ipAddress) && string.IsNullOrWhiteSpace(userAgent))
        {
            return null;
        }

        var payload = $"{ipAddress ?? string.Empty}|{userAgent ?? string.Empty}";
        using var sha = SHA256.Create();
        var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hashBytes);
    }
}
