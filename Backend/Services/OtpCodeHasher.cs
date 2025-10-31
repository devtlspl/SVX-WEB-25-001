using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace Backend.Services;

public class OtpCodeHasher : IOtpCodeHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int IterationCount = 100_000;

    public HashedOtp HashCode(string code)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);

        var saltBytes = RandomNumberGenerator.GetBytes(SaltSize);
        var hashBytes = KeyDerivation.Pbkdf2(
            password: code,
            salt: saltBytes,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: IterationCount,
            numBytesRequested: HashSize);

        return new HashedOtp(
            Convert.ToBase64String(hashBytes),
            Convert.ToBase64String(saltBytes));
    }

    public bool VerifyCode(string code, string hash, string salt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(hash);
        ArgumentException.ThrowIfNullOrWhiteSpace(salt);

        var saltBytes = Convert.FromBase64String(salt);

        var computedHash = KeyDerivation.Pbkdf2(
            password: code,
            salt: saltBytes,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: IterationCount,
            numBytesRequested: HashSize)
        ;

        var storedHashBytes = Convert.FromBase64String(hash);
        return storedHashBytes.Length == HashSize &&
               CryptographicOperations.FixedTimeEquals(computedHash, storedHashBytes);
    }
}
