using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class UserSession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = default!;

    [Required]
    [MaxLength(100)]
    public string SessionId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string LoginType { get; set; } = "otp";

    [MaxLength(100)]
    public string? IpAddress { get; set; }

    [MaxLength(100)]
    public string? LastSeenIpAddress { get; set; }

    [MaxLength(512)]
    public string? UserAgent { get; set; }

    [MaxLength(64)]
    public string? DeviceSignature { get; set; }

    [MaxLength(128)]
    public string? DeviceName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

    public DateTime? EndedAt { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(64)]
    public string? TerminatedBy { get; set; }
}
