using System.ComponentModel.DataAnnotations;

namespace Backend.Options;

public class JwtSettings
{
    private const int DefaultExpirationMinutes = 60 * 24 * 7;

    [Required]
    [MinLength(32, ErrorMessage = "JWT signing key must be at least 32 characters.")]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Issuer { get; set; } = string.Empty;

    public string? Audience { get; set; }

    [Range(5, 60 * 24 * 30, ErrorMessage = "JWT expiration must be between 5 minutes and 30 days.")]
    public int ExpirationMinutes { get; set; } = DefaultExpirationMinutes;
}
