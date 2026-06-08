using Duende.IdentityServer.EntityFramework.Entities;
using Duende.IdentityServer.EntityFramework.Extensions;
using Duende.IdentityServer.EntityFramework.Interfaces;
using Duende.IdentityServer.EntityFramework.Options;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace UrbanIssuesIdentity.Data;

/// <summary>
/// Single EF Core context that owns every OIDC-related table:
///   - ASP.NET Core Identity (users, roles, claims, logins, tokens) via <see cref="IdentityDbContext{TUser}"/>
///   - Duende IdentityServer configuration store (clients, resources, scopes, identity providers)
///     via <see cref="IConfigurationDbContext"/>
///   - Duende IdentityServer operational store (grants, device codes, keys, sessions, PAR)
///     via <see cref="IPersistedGrantDbContext"/>
/// </summary>
public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>,
      IConfigurationDbContext,
      IPersistedGrantDbContext
{
    private readonly ConfigurationStoreOptions _configurationStoreOptions;
    private readonly OperationalStoreOptions   _operationalStoreOptions;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ConfigurationStoreOptions configurationStoreOptions,
        OperationalStoreOptions operationalStoreOptions)
        : base(options)
    {
        _configurationStoreOptions = configurationStoreOptions;
        _operationalStoreOptions   = operationalStoreOptions;
    }

    // -------- Configuration store (IConfigurationDbContext) --------

    public DbSet<Client>             Clients             { get; set; } = null!;
    public DbSet<ClientCorsOrigin>   ClientCorsOrigins   { get; set; } = null!;
    public DbSet<IdentityResource>   IdentityResources   { get; set; } = null!;
    public DbSet<ApiResource>        ApiResources        { get; set; } = null!;
    public DbSet<ApiScope>           ApiScopes           { get; set; } = null!;
    public DbSet<IdentityProvider>   IdentityProviders   { get; set; } = null!;

    // -------- Operational store (IPersistedGrantDbContext) --------

    public DbSet<PersistedGrant>              PersistedGrants              { get; set; } = null!;
    public DbSet<DeviceFlowCodes>             DeviceFlowCodes              { get; set; } = null!;
    public DbSet<Key>                         Keys                         { get; set; } = null!;
    public DbSet<ServerSideSession>           ServerSideSessions           { get; set; } = null!;
    public DbSet<PushedAuthorizationRequest>  PushedAuthorizationRequests  { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ConfigureClientContext(_configurationStoreOptions);
        builder.ConfigureResourcesContext(_configurationStoreOptions);
        builder.ConfigureIdentityProviderContext(_configurationStoreOptions);
        builder.ConfigurePersistedGrantContext(_operationalStoreOptions);
    }

    // IPersistedGrantDbContext requires Task<int> SaveChangesAsync(); DbContext exposes
    // SaveChangesAsync(CancellationToken). Forward without a cancellation token to satisfy
    // the interface contract.
    Task<int> IPersistedGrantDbContext.SaveChangesAsync() => base.SaveChangesAsync();

    Task<int> IConfigurationDbContext.SaveChangesAsync() => base.SaveChangesAsync();
}
