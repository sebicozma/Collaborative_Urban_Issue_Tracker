using Duende.IdentityModel;
using Duende.IdentityServer.Models;

namespace UrbanIssuesIdentity;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
    [
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
        new IdentityResources.Email(),

        new IdentityResource(
            name:        "roles",
            displayName: "Your role(s)",
            userClaims:  [JwtClaimTypes.Role])
        {
            Emphasize = true
        }
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
            ClientId   = "urban-issues-admin",
            ClientName = "Urban Issues Admin Dashboard",

            AllowedGrantTypes   = GrantTypes.Code,
            RequirePkce         = true,
            RequireClientSecret = true,
            ClientSecrets       = { new Secret("dev-admin-secret".Sha256()) },

            // The admin app runs on port 3001; port 3000 belongs to the API gateway.
            RedirectUris           = { "http://localhost:3001/api/auth/callback" },
            PostLogoutRedirectUris = { "http://localhost:3001/" },

            AllowedScopes =
            {
                "openid",
                "profile",
                "email",
                "roles",
                "urban-issues-api.read",
                "urban-issues-api.write"
            },

            AllowOfflineAccess               = true,   // refresh tokens
            AllowAccessTokensViaBrowser      = false,
            RequireConsent                   = false,
            AlwaysIncludeUserClaimsInIdToken = true,   // guarantees role in id_token

            RefreshTokenUsage      = TokenUsage.OneTimeOnly,   // rotation
            RefreshTokenExpiration = TokenExpiration.Sliding
        },

        new Client
        {
            ClientId   = "urban-issues-mobile",
            ClientName = "Urban Issues Mobile App",

            // Native public client (no secret). Supports both the browser code+PKCE
            // flow and the direct password grant (ROPC) the Expo app uses today.
            AllowedGrantTypes   = { GrantType.AuthorizationCode, GrantType.ResourceOwnerPassword },
            RequirePkce         = true,
            RequireClientSecret = false,

            // expo-auth-session redirect URIs. Duende does exact-string matching,
            // so every environment the app runs in must be listed here:
            //   - Expo Go over USB (adb reverse) -> exp://127.0.0.1:8081/--/redirect
            //   - Expo Go on Wi-Fi LAN           -> exp://<dev-machine-LAN-IP>:8081/--/redirect
            //   - Dev / standalone build         -> urbanissuesmobile://redirect
            RedirectUris =
            {
                "exp://127.0.0.1:8081/--/redirect",
                "exp://192.168.0.116:8081/--/redirect",
                "urbanissuesmobile://redirect"
            },
            PostLogoutRedirectUris =
            {
                "exp://127.0.0.1:8081/--/redirect",
                "exp://192.168.0.116:8081/--/redirect",
                "urbanissuesmobile://redirect"
            },

            AllowedScopes =
            {
                "openid",
                "profile",
                "email",
                "roles",
                "urban-issues-api.read",
                "urban-issues-api.write"
            },

            AllowOfflineAccess               = true,   // refresh tokens
            RequireConsent                   = false,
            AlwaysIncludeUserClaimsInIdToken = true,   // guarantees role in id_token

            RefreshTokenUsage      = TokenUsage.OneTimeOnly,   // rotation
            RefreshTokenExpiration = TokenExpiration.Sliding
        }
    ];
}
