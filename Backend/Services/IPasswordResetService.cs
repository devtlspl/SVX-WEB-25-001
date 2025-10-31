using System;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services;

public interface IPasswordResetService
{
    Task<PasswordResetTokenResult> GenerateResetTokenAsync(Guid userId, string createdBy, string? reason = null, TimeSpan? lifetime = null, CancellationToken cancellationToken = default);
}

public record PasswordResetTokenResult(Guid TokenId, Guid UserId, string Token, DateTime ExpiresAt);
