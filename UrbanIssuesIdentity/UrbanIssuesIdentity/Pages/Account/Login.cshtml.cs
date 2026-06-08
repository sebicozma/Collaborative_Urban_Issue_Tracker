using System.ComponentModel.DataAnnotations;
using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using UrbanIssuesIdentity.Data;

namespace UrbanIssuesIdentity.Pages.Account;

/// <summary>
/// Backs the login form that Duende's <c>/connect/authorize</c> endpoint redirects
/// to whenever an OIDC authorization request arrives for an unauthenticated user.
/// On success, redirects back to <see cref="ReturnUrl"/>, which is the original
/// IdentityServer authorize URL — the OIDC flow then completes (consent if needed,
/// then redirect to the client with an authorization code).
/// </summary>
[AllowAnonymous]
public class LoginModel : PageModel
{
    private readonly SignInManager<ApplicationUser>     _signInManager;
    private readonly IIdentityServerInteractionService  _interaction;
    private readonly ILogger<LoginModel>                _logger;

    public LoginModel(
        SignInManager<ApplicationUser> signInManager,
        IIdentityServerInteractionService interaction,
        ILogger<LoginModel> logger)
    {
        _signInManager = signInManager;
        _interaction   = interaction;
        _logger        = logger;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();

    [BindProperty(SupportsGet = true)]
    public string ReturnUrl { get; set; } = "~/";

    public class InputModel
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        public bool RememberMe { get; set; }
    }

    public async Task<IActionResult> OnGetAsync(string? returnUrl = null)
    {
        ReturnUrl = returnUrl ?? Url.Content("~/");

        // If the user is already signed in and arrives here via /connect/authorize,
        // they may not need to log in again; just bounce back so IdentityServer
        // can finish the flow.
        if (User.Identity?.IsAuthenticated == true && await IsSafeReturnUrlAsync(ReturnUrl))
            return Redirect(ReturnUrl);

        return Page();
    }

    public async Task<IActionResult> OnPostAsync(string? returnUrl = null)
    {
        ReturnUrl = returnUrl ?? Url.Content("~/");

        if (!ModelState.IsValid)
            return Page();

        var result = await _signInManager.PasswordSignInAsync(
            userName:        Input.Username,
            password:        Input.Password,
            isPersistent:    Input.RememberMe,
            lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            _logger.LogInformation("Failed login attempt for {Username}.", Input.Username);
            ModelState.AddModelError(string.Empty, "Invalid username or password.");
            return Page();
        }

        _logger.LogInformation("User {Username} signed in.", Input.Username);

        return await IsSafeReturnUrlAsync(ReturnUrl)
            ? Redirect(ReturnUrl)
            : Redirect("~/");
    }

    /// <summary>
    /// Allow only local URLs or URLs that <see cref="IIdentityServerInteractionService"/>
    /// recognises as a valid authorize-request continuation. Prevents open-redirects.
    /// </summary>
    private async Task<bool> IsSafeReturnUrlAsync(string returnUrl)
    {
        if (Url.IsLocalUrl(returnUrl)) return true;

        var context = await _interaction.GetAuthorizationContextAsync(returnUrl);
        return context is not null;
    }
}
