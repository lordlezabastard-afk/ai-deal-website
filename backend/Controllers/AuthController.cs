using AiDeal.Api.Data;
using AiDeal.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDeal.Api.Controllers;

public record RegisterEmailRequest(string Email, string Password, string DisplayName);

public record RegisterTelegramRequest(long TelegramId, string? TelegramUsername, string DisplayName);

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db) : ControllerBase
{
    [HttpPost("register-email")]
    public async Task<IActionResult> RegisterEmail(RegisterEmailRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
        {
            return Conflict("Пользователь с таким email уже зарегистрирован.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName,
            CreatedAt = DateTime.UtcNow,
            IsEmailVerified = false
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new { user.Id, user.Email, user.DisplayName, user.CreatedAt });
    }

    [HttpPost("register-telegram")]
    public async Task<IActionResult> RegisterTelegram(RegisterTelegramRequest request)
    {
        if (await db.Users.AnyAsync(u => u.TelegramId == request.TelegramId))
        {
            return Conflict("Пользователь с таким Telegram ID уже зарегистрирован.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            TelegramId = request.TelegramId,
            TelegramUsername = request.TelegramUsername,
            DisplayName = request.DisplayName,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new { user.Id, user.TelegramId, user.TelegramUsername, user.DisplayName, user.CreatedAt });
    }
}
