namespace AiDeal.Api.Models;

public class User
{
    public Guid Id { get; set; }

    public string? Email { get; set; }

    public string? PasswordHash { get; set; }

    public long? TelegramId { get; set; }

    public string? TelegramUsername { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public bool IsEmailVerified { get; set; }

    public Guid? ReferredByUserId { get; set; }

    public User? ReferredByUser { get; set; }
}
