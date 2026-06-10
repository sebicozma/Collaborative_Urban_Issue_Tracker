using Duende.IdentityServer.Models;
using Duende.IdentityServer.Validation;
using Microsoft.AspNetCore.Identity;
using UrbanIssuesIdentity.Data;

namespace UrbanIssuesIdentity.Validation;

/// <summary>
/// Validates the Resource Owner Password Credentials grant (grant_type=password)
/// against ASP.NET Identity. This lets the mobile app exchange a username + password
/// directly for tokens, avoiding the interactive browser-redirect (code) flow that
/// doesn't round-trip cleanly in Expo Go. Duende does not ship a default ROPC
/// validator, so we register this one.
/// </summary>
public class ResourceOwnerPasswordValidator : IResourceOwnerPasswordValidator
{
    private readonly UserManager<ApplicationUser> _users;

    public ResourceOwnerPasswordValidator(UserManager<ApplicationUser> users) => _users = users;

    public async Task ValidateAsync(ResourceOwnerPasswordValidationContext context)
    {
        var user = await _users.FindByNameAsync(context.UserName);

        if (user is not null && await _users.CheckPasswordAsync(user, context.Password))
        {
            context.Result = new GrantValidationResult(
                subject: await _users.GetUserIdAsync(user),
                authenticationMethod: "pwd");
            return;
        }

        context.Result = new GrantValidationResult(
            TokenRequestErrors.InvalidGrant, "Invalid username or password.");
    }
}
