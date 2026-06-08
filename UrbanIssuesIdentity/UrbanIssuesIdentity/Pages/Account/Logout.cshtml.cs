using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using UrbanIssuesIdentity.Data;

namespace UrbanIssuesIdentity.Pages.Account;

/// <summary>
/// Backs Duende's <c>/connect/endsession</c> end-session flow. When a relying party
/// hits the OIDC logout endpoint with a valid <c>id_token_hint</c>, IdentityServer
/// stores a logout context keyed by <see cref="LogoutId"/> and redirects here.
/// We sign the user out of the local cookie, then bounce back to the client's
/// registered <c>post_logout_redirect_uri</c> if one was supplied.
/// </summary>
[AllowAnonymous]
public class LogoutModel : PageModel
{
    private readonly SignInManager<ApplicationUser>    _signInManager;
    private readonly IIdentityServerInteractionService _interaction;
    private readonly ILogger<LogoutModel>              _logger;

    public LogoutModel(
        SignInManager<ApplicationUser> signInManager,
        IIdentityServerInteractionService interaction,
        ILogger<LogoutModel> logger)
    {
        _signInManager = signInManager;
        _interaction   = interaction;
        _logger        = logger;
    }

    [BindProperty(SupportsGet = true)]
    public string? LogoutId { get; set; }

    public string? ClientName { get; set; }

    public async Task<IActionResult> OnGetAsync(string? logoutId)
    {
        LogoutId = logoutId;

        var context = await _interaction.GetLogoutContextAsync(LogoutId);

        // When the logout was initiated via /connect/endsession with a verified
        // id_token_hint, Duende sets ShowSignoutPrompt=false. In that case skip
        // the confirmation and sign out immediately.
        if (context?.ShowSignoutPrompt == false)
            return await OnPostAsync(LogoutId);

        ClientName = context?.ClientName ?? context?.ClientId;
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(string? logoutId)
    {
        LogoutId = logoutId;

        if (User.Identity?.IsAuthenticated == true)
        {
            await _signInManager.SignOutAsync();
            _logger.LogInformation("User signed out.");
        }

        var context = await _interaction.GetLogoutContextAsync(LogoutId);

        if (!string.IsNullOrWhiteSpace(context?.PostLogoutRedirectUri))
            return Redirect(context.PostLogoutRedirectUri);

        return RedirectToPage("/Account/LoggedOut");
    }
}
