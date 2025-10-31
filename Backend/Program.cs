using System;
using System.Linq;
using System.Text;
using Backend.Authorization;
using Backend.Data;
using Backend.Options;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPlanManagementService, PlanManagementService>();
builder.Services.AddScoped<IPlanAnalyticsService, PlanAnalyticsService>();
builder.Services.AddScoped<IUserAdministrationService, UserAdministrationService>();
builder.Services.AddScoped<IUserUsageService, UserUsageService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddSingleton<IPasswordHasher<Backend.Models.User>, PasswordHasher<Backend.Models.User>>();
builder.Services.AddSingleton<IOtpCodeHasher, OtpCodeHasher>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddOptions<JwtSettings>()
    .Bind(configuration.GetSection("Jwt"))
    .ValidateDataAnnotations()
    .Validate(settings => !string.Equals(settings.Key, "ChangeMe", StringComparison.OrdinalIgnoreCase), "JWT key must be replaced with a secure value.")
    .ValidateOnStart();

builder.Services.AddOptions<OtpSettings>()
    .Bind(configuration.GetSection("Otp"))
    .Validate(settings => settings.LifetimeMinutes is > 0 and <= 30, "OTP lifetime must be between 1 and 30 minutes.")
    .Validate(settings => settings.MaxVerificationAttempts is > 0 and <= 10, "OTP max attempts must be between 1 and 10.")
    .ValidateOnStart();

builder.Services.AddOptions<CorsSettings>()
    .Bind(configuration.GetSection("Cors"));

builder.Services.AddOptions<RazorpaySettings>()
    .Bind(configuration.GetSection("Razorpay"))
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.KeyId) && !string.IsNullOrWhiteSpace(settings.KeySecret), "Razorpay credentials must be configured.")
    .ValidateOnStart();

builder.Services.AddSingleton(provider =>
{
    var settings = provider.GetRequiredService<IOptions<RazorpaySettings>>().Value;
    return new Razorpay.Api.RazorpayClient(settings.KeyId, settings.KeySecret);
});

builder.WebHost.ConfigureKestrel((context, options) =>
{
    options.Configure(context.Configuration.GetSection("Kestrel"));
});

var corsSettings = configuration.GetSection("Cors").Get<CorsSettings>() ?? new CorsSettings();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendClient", policy =>
    {
        var allowedOrigins = corsSettings.AllowedOrigins
            .Select(origin => origin.Trim())
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray();

        if (allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();

            if (corsSettings.AllowCredentials)
            {
                policy.AllowCredentials();
            }
        }
    });
});

var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings are not configured.");
if (string.IsNullOrWhiteSpace(jwtSettings.Key))
{
    throw new InvalidOperationException("JWT key is not configured.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = !string.IsNullOrWhiteSpace(jwtSettings.Audience),
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = string.IsNullOrWhiteSpace(jwtSettings.Audience) ? null : jwtSettings.Audience,
        IssuerSigningKey = signingKey
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var userIdClaim = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var sessionIdClaim = context.Principal?.FindFirstValue("sessionId");

            if (string.IsNullOrWhiteSpace(userIdClaim) || string.IsNullOrWhiteSpace(sessionIdClaim))
            {
                context.Fail("Invalid session.");
                return;
            }

            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                context.Fail("Invalid session.");
                return;
            }

            var user = await dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId);
            if (user is null || string.IsNullOrWhiteSpace(user.CurrentSessionId) || !string.Equals(user.CurrentSessionId, sessionIdClaim, StringComparison.Ordinal))
            {
                context.Fail("Session expired.");
                return;
            }

            var session = await dbContext.UserSessions
                .SingleOrDefaultAsync(s => s.UserId == userId && s.SessionId == sessionIdClaim, context.HttpContext.RequestAborted);

            if (session is not null)
            {
                session.LastSeenAt = DateTime.UtcNow;
                session.LastSeenIpAddress = GetClientIp(context.HttpContext);
                await dbContext.SaveChangesAsync(context.HttpContext.RequestAborted);
            }
        }
    };
});

builder.Services.AddAuthorization(options => AuthorizationPolicies.Register(options));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static string? GetClientIp(HttpContext? context)
{
    if (context is null)
    {
        return null;
    }

    if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded) && !string.IsNullOrWhiteSpace(forwarded))
    {
        var first = forwarded.ToString().Split(',').FirstOrDefault();
        return string.IsNullOrWhiteSpace(first) ? null : first.Trim();
    }

    var remoteIp = context.Connection.RemoteIpAddress;
    return remoteIp is null ? null : remoteIp.ToString();
}
