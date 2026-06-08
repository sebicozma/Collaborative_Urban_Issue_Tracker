using System.Net.Http;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace UrbanIssuesIdentity.OpenApi;

/// <summary>
/// Appends Duende IdentityServer's OIDC protocol endpoints to the generated
/// OpenAPI document.
///
/// These endpoints are handled by IdentityServer middleware (registered via
/// <c>app.UseIdentityServer()</c>) — they are not MVC controllers or minimal
/// APIs, so <c>Microsoft.AspNetCore.OpenApi</c> cannot discover them through
/// endpoint metadata. This transformer declares them by hand so they show up
/// in Scalar / any OpenAPI consumer.
/// </summary>
public sealed class OidcEndpointsDocumentTransformer : IOpenApiDocumentTransformer
{
    private const string TagName = "OpenID Connect";

    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        document.Tags ??= new HashSet<OpenApiTag>();
        if (document.Tags.All(t => t.Name != TagName))
        {
            document.Tags.Add(new OpenApiTag
            {
                Name        = TagName,
                Description = "Protocol endpoints implemented by Duende IdentityServer middleware. " +
                              "The authoritative URLs and capabilities live in the discovery document at " +
                              "/.well-known/openid-configuration."
            });
        }

        var tag = new OpenApiTagReference(TagName, document, null!);

        document.Paths["/.well-known/openid-configuration"] = Discovery(tag);
        document.Paths["/connect/authorize"]                = Authorize(tag);
        document.Paths["/connect/token"]                    = Token(tag);
        document.Paths["/connect/userinfo"]                 = UserInfo(tag);
        document.Paths["/connect/endsession"]               = EndSession(tag);
        document.Paths["/connect/introspect"]               = Introspect(tag);
        document.Paths["/connect/revocation"]               = Revocation(tag);

        return Task.CompletedTask;
    }

    // -- Endpoint definitions ------------------------------------------------

    private static OpenApiPathItem Discovery(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Get] = new OpenApiOperation
            {
                Tags        = TagSet(tag),
                Summary     = "OIDC discovery document",
                Description = "OpenID Connect provider metadata: endpoint URLs, supported scopes/claims/grant types, " +
                              "and a pointer to the JWKS used to verify token signatures.",
                Responses   = OkJson("OIDC metadata document.")
            }
        }
    };

    private static OpenApiPathItem Authorize(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Get] = new OpenApiOperation
            {
                Tags        = TagSet(tag),
                Summary     = "Authorization endpoint",
                Description = "Starts an OAuth 2.0 / OIDC flow. Unauthenticated users are redirected to the login page; " +
                              "on success the browser is redirected back to the client's redirect_uri with an " +
                              "authorization code (or token, depending on response_type).",
                Parameters  =
                [
                    Query("client_id",             "Registered client identifier.", required: true),
                    Query("response_type",         "Expected response. Use 'code' for authorization code flow.",
                                                   required: true, allowed: ["code", "id_token", "code id_token", "token"]),
                    Query("redirect_uri",          "Where to send the response. Must match a registered redirect URI.", required: true),
                    Query("scope",                 "Space-separated scopes; include 'openid' for OIDC.", required: true),
                    Query("state",                 "Opaque value echoed back; use to mitigate CSRF."),
                    Query("nonce",                 "Mitigates replay attacks; echoed in the issued id_token."),
                    Query("code_challenge",        "PKCE challenge — base64url(SHA-256(code_verifier))."),
                    Query("code_challenge_method", "PKCE method.", allowed: ["S256", "plain"]),
                    Query("response_mode",         "How the response is returned.", allowed: ["query", "fragment", "form_post"]),
                    Query("prompt",                "Whether to prompt for login/consent.", allowed: ["none", "login", "consent", "select_account"]),
                    Query("login_hint",            "Hint to pre-fill the username on the login page."),
                    Query("max_age",               "Maximum age of the user's authentication, in seconds."),
                    Query("acr_values",            "Requested Authentication Context Class Reference values."),
                    Query("id_token_hint",         "Previously issued id_token for silent re-auth.")
                ],
                Responses = RedirectResponses("Redirect to redirect_uri with code/state — or to /Account/Login if unauthenticated.")
            }
        }
    };

    private static OpenApiPathItem Token(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Post] = new OpenApiOperation
            {
                Tags        = TagSet(tag),
                Summary     = "Token endpoint",
                Description = "Exchanges an authorization code (or refresh token, or client credentials) for tokens. " +
                              "Client authentication: HTTP Basic with client_id:client_secret, or client_id+client_secret as form fields. " +
                              "Public clients omit the secret and send a PKCE code_verifier instead.",
                RequestBody = FormBody(properties:
                    [
                        ("grant_type",    StringSchema(allowed: ["authorization_code", "refresh_token", "client_credentials"]),
                                          "OAuth 2.0 grant type."),
                        ("code",          StringSchema(), "Authorization code from /connect/authorize. Required for authorization_code grant."),
                        ("redirect_uri",  StringSchema(), "Must match the redirect_uri used at /connect/authorize."),
                        ("code_verifier", StringSchema(), "PKCE verifier — the plain value whose hash was sent as code_challenge."),
                        ("client_id",     StringSchema(), "Client identifier (or send via HTTP Basic auth)."),
                        ("client_secret", StringSchema(), "Client secret for confidential clients (or send via HTTP Basic auth)."),
                        ("refresh_token", StringSchema(), "Required for refresh_token grant."),
                        ("scope",         StringSchema(), "Optional space-separated scopes; defaults to scopes from the original grant.")
                    ],
                    required: ["grant_type"]),
                Responses = OkJson("JSON with access_token, token_type, expires_in — plus id_token, refresh_token, scope when applicable.")
            }
        }
    };

    private static OpenApiPathItem UserInfo(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Get]  = UserInfoOp(tag),
            [HttpMethod.Post] = UserInfoOp(tag)
        }
    };

    private static OpenApiOperation UserInfoOp(OpenApiTagReference tag) => new()
    {
        Tags        = TagSet(tag),
        Summary     = "UserInfo endpoint",
        Description = "Returns claims about the authenticated subject. Authorise with `Authorization: Bearer <access_token>`. " +
                      "The access token must have been issued with the 'openid' scope; additional claims depend on " +
                      "scopes granted (profile, email, ...).",
        Responses   = OkJson("JSON with the user's claims (sub, name, email, ...).")
    };

    private static OpenApiPathItem EndSession(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Get] = new OpenApiOperation
            {
                Tags        = TagSet(tag),
                Summary     = "End-session (logout) endpoint",
                Description = "RP-initiated logout. Clears the IdP session cookie and redirects back to the client's " +
                              "post_logout_redirect_uri if one was provided and is registered for the client.",
                Parameters  =
                [
                    Query("id_token_hint",            "ID token previously issued to the client; identifies the session and lets IdentityServer skip the confirmation prompt."),
                    Query("post_logout_redirect_uri", "URL to redirect to after logout. Must be registered on the client."),
                    Query("state",                    "Opaque value echoed back to the post-logout URL."),
                    Query("client_id",                "Client initiating logout (alternative to id_token_hint).")
                ],
                Responses = RedirectResponses("Redirect to post_logout_redirect_uri — or to /Account/Logout for the confirmation prompt.")
            }
        }
    };

    private static OpenApiPathItem Introspect(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Post] = new OpenApiOperation
            {
                Tags        = TagSet(tag),
                Summary     = "Token introspection (RFC 7662)",
                Description = "Returns metadata about a token (`active`, `exp`, `scope`, `sub`, ...). " +
                              "Requires API resource secret or client credentials in the HTTP Basic auth header.",
                RequestBody = FormBody(properties:
                    [
                        ("token",           StringSchema(), "The token to introspect."),
                        ("token_type_hint", StringSchema(allowed: ["access_token", "refresh_token"]),
                                            "Optional hint to speed up lookup.")
                    ],
                    required: ["token"]),
                Responses = OkJson("JSON with 'active' (bool) and, when active, the token's claims.")
            }
        }
    };

    private static OpenApiPathItem Revocation(OpenApiTagReference tag) => new()
    {
        Operations = new Dictionary<HttpMethod, OpenApiOperation>
        {
            [HttpMethod.Post] = new OpenApiOperation
            {
                Tags        = TagSet(tag),
                Summary     = "Token revocation (RFC 7009)",
                Description = "Revokes the supplied access or refresh token. Requires client authentication. " +
                              "Returns 200 even if the token was unknown, per the RFC.",
                RequestBody = FormBody(properties:
                    [
                        ("token",           StringSchema(), "The token to revoke."),
                        ("token_type_hint", StringSchema(allowed: ["access_token", "refresh_token"]),
                                            "Optional hint to speed up lookup.")
                    ],
                    required: ["token"]),
                Responses = new OpenApiResponses
                {
                    ["200"] = new OpenApiResponse { Description = "Revocation accepted." }
                }
            }
        }
    };

    // -- Helpers -------------------------------------------------------------

    private static HashSet<OpenApiTagReference> TagSet(OpenApiTagReference tag) => [tag];

    private static OpenApiParameter Query(string name, string description, bool required = false, string[]? allowed = null) =>
        new()
        {
            Name        = name,
            In          = ParameterLocation.Query,
            Required    = required,
            Description = description,
            Schema      = StringSchema(allowed)
        };

    private static OpenApiSchema StringSchema(string[]? allowed = null)
    {
        var schema = new OpenApiSchema { Type = JsonSchemaType.String };
        if (allowed is not null)
        {
            schema.Enum = allowed.Select(v => (JsonNode)JsonValue.Create(v)!).ToList();
        }
        return schema;
    }

    private static OpenApiRequestBody FormBody(
        IEnumerable<(string Name, OpenApiSchema Schema, string Description)> properties,
        IEnumerable<string> required)
    {
        var props = new Dictionary<string, IOpenApiSchema>();
        foreach (var (name, schema, description) in properties)
        {
            schema.Description = description;
            props[name] = schema;
        }

        return new OpenApiRequestBody
        {
            Required = true,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/x-www-form-urlencoded"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type       = JsonSchemaType.Object,
                        Properties = props,
                        Required   = new HashSet<string>(required)
                    }
                }
            }
        };
    }

    private static OpenApiResponses OkJson(string description) =>
        new()
        {
            ["200"] = new OpenApiResponse
            {
                Description = description,
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType()
                }
            }
        };

    private static OpenApiResponses RedirectResponses(string redirectDescription) =>
        new()
        {
            ["302"] = new OpenApiResponse { Description = redirectDescription },
            ["400"] = new OpenApiResponse { Description = "Invalid request — error details in the response or in the redirect URL fragment." }
        };
}
