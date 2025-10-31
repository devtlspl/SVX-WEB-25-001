namespace Backend.Services;

public readonly record struct HashedOtp(string Hash, string Salt);
