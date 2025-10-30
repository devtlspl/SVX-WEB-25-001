using System.Security.Cryptography;
using System;
using System.Linq;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly TimeSpan _otpLifetime = TimeSpan.FromMinutes(5);

    public AuthService(AppDbContext dbContext, IPasswordHasher<User> passwordHasher, IJwtService jwtService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
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

        var sessionId = Guid.NewGuid().ToString("N");
        user.CurrentSessionId = sessionId;
        await _dbContext.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user, sessionId);
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
        var expiresAt = DateTime.UtcNow.Add(_otpLifetime);

        var otpEntity = new UserOtp
        {
            UserId = user.Id,
            Code = code,
            ExpiresAt = expiresAt,
            Purpose = "login",
            Consumed = false
        };

        _dbContext.UserOtps.Add(otpEntity);
        await _dbContext.SaveChangesAsync();

        var maskedPhone = MaskPhone(normalizedPhone);
        return new OtpDispatchResult(maskedPhone, expiresAt, user.IsRegistrationComplete && user.IsSubscribed, code);
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

        if (DateTime.UtcNow > otp.ExpiresAt)
        {
            otp.Consumed = true;
            await _dbContext.SaveChangesAsync();
            throw new InvalidOperationException("OTP has expired. Request a new code.");
        }

        otp.AttemptCount += 1;

        if (!string.Equals(otp.Code, code.Trim(), StringComparison.Ordinal))
        {
            if (otp.AttemptCount >= 5)
            {
                otp.Consumed = true;
            }
            await _dbContext.SaveChangesAsync();
            throw new InvalidOperationException("Invalid OTP code.");
        }

        otp.Consumed = true;
        var sessionId = Guid.NewGuid().ToString("N");
        user.CurrentSessionId = sessionId;

        await _dbContext.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user, sessionId);
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
}
