using System.Security.Cryptography;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class PasswordResetService : IPasswordResetService
{
    private static readonly TimeSpan DefaultLifetime = TimeSpan.FromHours(24);

    private readonly AppDbContext _dbContext;
    private readonly IOtpCodeHasher _codeHasher;

    public PasswordResetService(AppDbContext dbContext, IOtpCodeHasher codeHasher)
    {
        _dbContext = dbContext;
        _codeHasher = codeHasher;
    }

    public async Task<PasswordResetTokenResult> GenerateResetTokenAsync(Guid userId, string createdBy, string? reason = null, TimeSpan? lifetime = null, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var token = GenerateSecureToken();
        var hashed = _codeHasher.HashCode(token);
        var expiresAt = DateTime.UtcNow.Add(lifetime ?? DefaultLifetime);

        var passwordResetToken = new PasswordResetToken
        {
            UserId = userId,
            TokenHash = hashed.Hash,
            TokenSalt = hashed.Salt,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            ExpiresAt = expiresAt,
            Reason = reason
        };

        _dbContext.PasswordResetTokens.Add(passwordResetToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new PasswordResetTokenResult(passwordResetToken.Id, userId, token, expiresAt);
    }

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", string.Empty, StringComparison.Ordinal)
            .Replace("/", string.Empty, StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);
    }
}
