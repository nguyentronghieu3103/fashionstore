namespace fashionstore.Models.Dtos
{
    public class VerifyOtpRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string? ReturnUrl { get; set; }
    }
}
