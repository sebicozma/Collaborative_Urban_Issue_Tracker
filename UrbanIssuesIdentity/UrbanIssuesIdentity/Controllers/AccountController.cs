using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Duende.IdentityModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using UrbanIssuesIdentity.Data;
using UrbanIssuesIdentity.Messaging;
using UrbanIssuesIdentity.Messaging.Events;

namespace UrbanIssuesIdentity.Controllers;

[ApiController]
[AllowAnonymous]
[Route("account")]
public sealed class AccountController : ControllerBase
{
    private const string UserRegisteredRoutingKey = "user.registered";
    private const string DefaultRole              = "citizen";

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEventPublisher              _events;
    private readonly ILogger<AccountController>   _logger;

    public AccountController(
        UserManager<ApplicationUser> userManager,
        IEventPublisher events,
        ILogger<AccountController> logger)
    {
        _userManager = userManager;
        _events      = events;
        _logger      = logger;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup(
        [FromBody] SignupRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = new ApplicationUser
        {
            UserName       = request.Username,
            Email          = request.Email,
            EmailConfirmed = false,
            DisplayName    = request.Username
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            foreach (var error in createResult.Errors)
                ModelState.AddModelError(error.Code, error.Description);

            return ValidationProblem(ModelState);
        }

        await _userManager.AddToRoleAsync(user, DefaultRole);

        await _userManager.AddClaimsAsync(user,
        [
            new Claim(JwtClaimTypes.Name,  request.Username),
            new Claim(JwtClaimTypes.Email, request.Email)
        ]);

        var @event = new UserRegisteredEvent(
            EventId:    Guid.NewGuid(),
            OccurredAt: DateTimeOffset.UtcNow,
            UserId:     user.Id,
            Username:   request.Username,
            Email:      request.Email);

        try
        {
            await _events.PublishAsync(UserRegisteredRoutingKey, @event, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to publish user.registered event for {UserId}. User was created in the database.",
                user.Id);
        }

        return CreatedAtAction(nameof(Signup), new { id = user.Id }, new
        {
            userId   = user.Id,
            username = request.Username,
            email    = request.Email
        });
    }

    public sealed class SignupRequest
    {
        [Required, MinLength(3), MaxLength(64)]
        public string Username { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(8), MaxLength(128)]
        public string Password { get; set; } = string.Empty;
    }
}
