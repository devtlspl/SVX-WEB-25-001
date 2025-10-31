using System;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserOtp> UserOtps => Set<UserOtp>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<UserPlanHistory> UserPlanHistories => Set<UserPlanHistory>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.PhoneNumber)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasMany(u => u.UserRoles)
            .WithOne(ur => ur.User)
            .HasForeignKey(ur => ur.UserId);

        modelBuilder.Entity<User>()
            .HasMany(u => u.PlanHistory)
            .WithOne(ph => ph.User)
            .HasForeignKey(ph => ph.UserId);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Sessions)
            .WithOne(session => session.User)
            .HasForeignKey(session => session.UserId);

        modelBuilder.Entity<User>()
            .HasMany(u => u.PasswordResetTokens)
            .WithOne(token => token.User)
            .HasForeignKey(token => token.UserId);

        modelBuilder.Entity<User>()
            .HasOne(u => u.ActivePlan)
            .WithMany()
            .HasForeignKey(u => u.ActivePlanId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<User>()
            .HasOne(u => u.PendingPlan)
            .WithMany()
            .HasForeignKey(u => u.PendingPlanId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserOtp>()
            .HasIndex(o => new { o.UserId, o.Purpose, o.Consumed });

        modelBuilder.Entity<Invoice>()
            .HasIndex(i => i.InvoiceNumber)
            .IsUnique();

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Plan>()
            .HasIndex(p => p.Name)
            .IsUnique();

        modelBuilder.Entity<UserRole>()
            .HasIndex(ur => new { ur.UserId, ur.RoleId })
            .IsUnique();

        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(role => role.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserPlanHistory>()
            .HasIndex(p => new { p.UserId, p.PlanId, p.Status });

        modelBuilder.Entity<UserPlanHistory>()
            .HasOne(history => history.Plan)
            .WithMany(plan => plan.PlanHistory)
            .HasForeignKey(history => history.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserSession>()
            .HasIndex(session => new { session.UserId, session.SessionId })
            .IsUnique();

        modelBuilder.Entity<UserSession>()
            .HasIndex(session => new { session.UserId, session.CreatedAt });

        modelBuilder.Entity<PasswordResetToken>()
            .HasIndex(token => new { token.UserId, token.ExpiresAt });

        var adminRoleId = "admin";
        var userRoleId = "user";
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = adminRoleId, Name = "admin", Description = "Administrative access to manage the platform." },
            new Role { Id = userRoleId, Name = "user", Description = "Standard user access." }
        );

        var starterPlanId = "starter";
        var growthPlanId = "growth";
        var enterprisePlanId = "enterprise";
        modelBuilder.Entity<Plan>().HasData(
            new Plan
            {
                Id = starterPlanId,
                Name = "Starter",
                Description = "Core access for individual traders.",
                Price = 29.00m,
                Currency = "USD",
                BillingInterval = "monthly",
                DisplayOrder = 1,
                FeatureSummary = "Real-time alerts; Basic analytics; Email support",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Plan
            {
                Id = growthPlanId,
                Name = "Growth",
                Description = "Collaborative access for small teams.",
                Price = 79.00m,
                Currency = "USD",
                BillingInterval = "monthly",
                DisplayOrder = 2,
                FeatureSummary = "Everything in Starter; Team workspaces; Advanced analytics; Priority support",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Plan
            {
                Id = enterprisePlanId,
                Name = "Enterprise",
                Description = "Custom solutions with dedicated support.",
                Price = 249.00m,
                Currency = "USD",
                BillingInterval = "monthly",
                DisplayOrder = 3,
                FeatureSummary = "Growth features; Custom integrations; Dedicated CSM; Premium analytics",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
