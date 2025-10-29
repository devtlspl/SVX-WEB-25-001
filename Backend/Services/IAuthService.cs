using Backend.Models;

namespace Backend.Services;

public interface IAuthService
{
    Task<User> RegisterAsync(RegisterUserRequest request);
    Task<(User user, string token)> AdminLoginAsync(string email, string password);
    Task<OtpDispatchResult> RequestLoginOtpAsync(string phoneNumber, string password);
    Task<(User user, string token)> VerifyLoginOtpAsync(string phoneNumber, string code);
}

public record RegisterUserRequest(
    string Name,
    string Email,
    string PhoneNumber,
    string Password,
    string GovernmentIdType,
    string GovernmentIdNumber,
    string? GovernmentDocumentUrl,
    bool AcceptTerms);

public record OtpDispatchResult(string MaskedPhoneNumber, DateTime ExpiresAt, bool IsRegistrationComplete, string? DebugCode = null);
