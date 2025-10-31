namespace Backend.Options;

public class OtpSettings
{
    private const int DefaultLifetimeMinutes = 5;
    private const int DefaultMaxAttempts = 5;

    public int LifetimeMinutes { get; set; } = DefaultLifetimeMinutes;
    public int MaxVerificationAttempts { get; set; } = DefaultMaxAttempts;
    public bool ExposeCodesInResponses { get; set; } = true;
}
