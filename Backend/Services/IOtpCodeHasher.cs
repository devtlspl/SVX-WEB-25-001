namespace Backend.Services;

public interface IOtpCodeHasher
{
    HashedOtp HashCode(string code);
    bool VerifyCode(string code, string hash, string salt);
}
