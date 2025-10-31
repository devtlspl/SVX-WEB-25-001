using Microsoft.AspNetCore.Authorization;

namespace Backend.Authorization;

public static class AuthorizationPolicies
{
    public const string AdminOnly = "RequireAdminRole";
    public const string UserOrAdmin = "RequireUserRole";

    public static void Register(AuthorizationOptions options)
    {
        options.AddPolicy(AdminOnly, policy => policy.RequireRole("admin"));
        options.AddPolicy(UserOrAdmin, policy => policy.RequireRole("admin", "user"));
    }
}
