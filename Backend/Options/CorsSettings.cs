namespace Backend.Options;

public class CorsSettings
{
    public string[] AllowedOrigins { get; set; } = System.Array.Empty<string>();
    public bool AllowCredentials { get; set; }
}
