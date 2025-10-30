namespace Backend.Services;

public class RazorpaySettings
{
    public string KeyId { get; set; } = string.Empty;
    public string KeySecret { get; set; } = string.Empty;
    public int DefaultAmountInPaise { get; set; } = 49900; // Rs 499.00
    public string Currency { get; set; } = "INR";
    public string PlanDescription { get; set; } = "Monthly Subscription";
}
