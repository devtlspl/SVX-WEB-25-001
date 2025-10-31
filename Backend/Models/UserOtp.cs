using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class UserOtp
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = default!;

    [Required]
    [MaxLength(256)]
    public string CodeHash { get; set; } = default!;

    [Required]
    [MaxLength(44)]
    public string Salt { get; set; } = default!;

    [Required]
    public DateTime ExpiresAt { get; set; }

    public bool Consumed { get; set; }

    [MaxLength(20)]
    public string Purpose { get; set; } = "login";

    public int AttemptCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
