using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Linq;
using Backend.Models;
using Backend.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public class JwtService : IJwtService
{
    private readonly JwtSettings _settings;

    public JwtService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }

    public string GenerateToken(User user, string sessionId, IEnumerable<string>? roles = null)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new("isSubscribed", user.IsSubscribed.ToString()),
            new("sessionId", sessionId)
        };

        if (!string.IsNullOrWhiteSpace(user.PhoneNumber))
        {
            claims.Add(new Claim("phoneNumber", user.PhoneNumber));
        }

        if (!string.IsNullOrWhiteSpace(user.SubscriptionId))
        {
            claims.Add(new Claim("subscriptionId", user.SubscriptionId!));
        }

        var roleSet = roles is null
            ? Array.Empty<string>()
            : roles.Where(r => !string.IsNullOrWhiteSpace(r))
                   .Select(r => r.Trim().ToLowerInvariant())
                   .Distinct(StringComparer.OrdinalIgnoreCase)
                   .ToArray();

        foreach (var role in roleSet)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        if (user.IsAdmin && !roleSet.Contains("admin", StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(new Claim(ClaimTypes.Role, "admin"));
        }

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience ?? _settings.Issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
