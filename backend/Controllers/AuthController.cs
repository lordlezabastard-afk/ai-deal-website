using AiDeal.Api.Data;
using AiDeal.Api.Models;
using AiDeal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDeal.Api.Controllers;

public record RegisterEmailRequest(string Email, string Password, string DisplayName);

public record RegisterTelegramRequest(long TelegramId, string? TelegramUsername, string DisplayName);

public record LoginRequest(string Identifier, string Password);

public record LogoutRequest(string RefreshToken);

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokenService) : ControllerBase
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

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Identifier);

        if (user is null || user.PasswordHash is null ||
            !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Неверный email или пароль" });
        }

        var accessToken = tokenService.CreateAccessToken(user);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = TokenService.CreateRefreshTokenValue(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(TokenService.RefreshTokenLifetime),
            IsRevoked = false,
        };

        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        return Ok(new
        {
            accessToken,
            refreshToken = refreshToken.Token,
            user = new { user.Id, user.Email, user.DisplayName },
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        var token = await db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);
        if (token is not null)
        {
            token.IsRevoked = true;
            await db.SaveChangesAsync();
        }

        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new { user.Id, user.Email, user.DisplayName });
    }
}
