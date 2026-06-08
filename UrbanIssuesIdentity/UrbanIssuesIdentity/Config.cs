using Duende.IdentityServer.Models;

namespace UrbanIssuesIdentity;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
    [
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
        new IdentityResources.Email()
    ];

    public static IEnumerable<ApiScope> ApiScopes =>
    [
        new ApiScope("urban-issues-api.read",  "Read access to Urban Issues API"),
        new ApiScope("urban-issues-api.write", "Write access to Urban Issues API")
    ];

    public static IEnumerable<ApiResource> ApiResources =>
    [
        new ApiResource("urban-issues-api", "Urban Issues API")
        {
            Scopes = { "urban-issues-api.read", "urban-issues-api.write" },
            UserClaims = { "role" }
        }
    ];

    public static IEnumerable<Client> Clients =>
    [
        new Client
        {
            ClientId = "urban-issues-web",
            ClientName = "Urban Issues Web Client",

            AllowedGrantTypes = GrantTypes.Code,
            RequirePkce = true,
            RequireClientSecret = false,

            RedirectUris           = { "https://localhost:7000/signin-oidc" },
            PostLogoutRedirectUris = { "https://localhost:7000/signout-callback-oidc" },
            AllowedCorsOrigins     = { "https://localhost:7000" },

            AllowedScopes =
            {
                "openid",
                "profile",
                "email",
                "urban-issues-api.read",
                "urban-issues-api.write"
            },

            AllowOfflineAccess = true
        }
    ];
}
