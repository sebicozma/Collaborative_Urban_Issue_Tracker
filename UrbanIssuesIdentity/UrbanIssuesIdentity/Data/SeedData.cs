using System.Security.Claims;
using Duende.IdentityModel;
using Duende.IdentityServer.EntityFramework.Mappers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace UrbanIssuesIdentity.Data;

/// <summary>
/// Idempotent startup seeder. Applies pending EF migrations, then inserts the
/// IdentityServer configuration (identity resources, API scopes, API resources,
/// clients), the default roles, and the development test users — but only when
/// the rows don't already exist. Running it repeatedly is a no-op after the
/// first successful run.
/// </summary>
public static class SeedData
{
    public static async Task EnsureSeededAsync(
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var sp     = scope.ServiceProvider;
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(SeedData));

        logger.LogInformation("Seeder: starting.");

        var db = sp.GetRequiredService<ApplicationDbContext>();
        var connection = db.Database.GetDbConnection();

        logger.LogInformation("Seeder: applying pending migrations to '{Database}' on '{DataSource}'.",
            connection.Database, connection.DataSource);

        await db.Database.MigrateAsync(cancellationToken);

        await SeedIdentityResourcesAsync(db, logger, cancellationToken);
        await SeedApiScopesAsync(db, logger, cancellationToken);
        await SeedApiResourcesAsync(db, logger, cancellationToken);
        await SeedClientsAsync(db, logger, cancellationToken);

        await SeedRolesAsync(sp, logger);
        await SeedUsersAsync(sp, logger);

        logger.LogInformation("Seeder: complete.");
    }

    // -- IdentityServer configuration -----------------------------------------

    private static async Task SeedIdentityResourcesAsync(ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        var existing = await db.IdentityResources
            .Select(r => r.Name)
            .ToListAsync(ct);

        var missing = Config.IdentityResources
            .Where(r => !existing.Contains(r.Name))
            .Select(r => r.ToEntity())
            .ToList();

        if (missing.Count == 0)
        {
            logger.LogInformation("Seeder: identity resources already present ({Count}). Skipping.", existing.Count);
            return;
        }

        db.IdentityResources.AddRange(missing);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Seeder: inserted {Count} identity resources: {Names}",
            missing.Count, string.Join(", ", missing.Select(m => m.Name)));
    }

    private static async Task SeedApiScopesAsync(ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        var existing = await db.ApiScopes
            .Select(s => s.Name)
            .ToListAsync(ct);

        var missing = Config.ApiScopes
            .Where(s => !existing.Contains(s.Name))
            .Select(s => s.ToEntity())
            .ToList();

        if (missing.Count == 0)
        {
            logger.LogInformation("Seeder: API scopes already present ({Count}). Skipping.", existing.Count);
            return;
        }

        db.ApiScopes.AddRange(missing);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Seeder: inserted {Count} API scopes: {Names}",
            missing.Count, string.Join(", ", missing.Select(m => m.Name)));
    }

    private static async Task SeedApiResourcesAsync(ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        var existing = await db.ApiResources
            .Select(r => r.Name)
            .ToListAsync(ct);

        var missing = Config.ApiResources
            .Where(r => !existing.Contains(r.Name))
            .Select(r => r.ToEntity())
            .ToList();

        if (missing.Count == 0)
        {
            logger.LogInformation("Seeder: API resources already present ({Count}). Skipping.", existing.Count);
            return;
        }

        db.ApiResources.AddRange(missing);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Seeder: inserted {Count} API resources: {Names}",
            missing.Count, string.Join(", ", missing.Select(m => m.Name)));
    }

    private static async Task SeedClientsAsync(ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        var existing = await db.Clients
            .Select(c => c.ClientId)
            .ToListAsync(ct);

        var missing = Config.Clients
            .Where(c => !existing.Contains(c.ClientId))
            .Select(c => c.ToEntity())
            .ToList();

        if (missing.Count == 0)
        {
            logger.LogInformation("Seeder: clients already present ({Count}). Skipping.", existing.Count);
            return;
        }

        db.Clients.AddRange(missing);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Seeder: inserted {Count} clients: {Ids}",
            missing.Count, string.Join(", ", missing.Select(m => m.ClientId)));
    }

    // -- ASP.NET Identity -----------------------------------------------------

    private static readonly string[] Roles = ["admin", "citizen"];

    private static async Task SeedRolesAsync(IServiceProvider sp, ILogger logger)
    {
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in Roles)
        {
            if (await roleManager.RoleExistsAsync(role))
            {
                logger.LogInformation("Seeder: role '{Role}' already exists. Skipping.", role);
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole(role));
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Seeding role '{role}' failed: " +
                    string.Join("; ", result.Errors.Select(e => e.Description)));
            }

            logger.LogInformation("Seeder: created role '{Role}'.", role);
        }
    }

    private static async Task SeedUsersAsync(IServiceProvider sp, ILogger logger)
    {
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();

        await EnsureUserAsync(userManager, logger,
            username:    "alice",
            password:    "Test1234",
            email:       "alice@example.com",
            displayName: "Alice Smith",
            givenName:   "Alice",
            familyName:  "Smith",
            role:        "admin");

        await EnsureUserAsync(userManager, logger,
            username:    "bob",
            password:    "Test1234",
            email:       "bob@example.com",
            displayName: "Bob Jones",
            givenName:   "Bob",
            familyName:  "Jones",
            role:        "citizen");
    }

    private static async Task EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        string username,
        string password,
        string email,
        string displayName,
        string givenName,
        string familyName,
        string role)
    {
        if (await userManager.FindByNameAsync(username) is not null)
        {
            logger.LogInformation("Seeder: user '{Username}' already exists. Skipping.", username);
            return;
        }

        var user = new ApplicationUser
        {
            UserName       = username,
            Email          = email,
            EmailConfirmed = true,
            DisplayName    = displayName
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Seeding user '{username}' failed: " +
                string.Join("; ", createResult.Errors.Select(e => e.Description)));
        }

        await userManager.AddToRoleAsync(user, role);

        await userManager.AddClaimsAsync(user,
        [
            new Claim(JwtClaimTypes.Name,       displayName),
            new Claim(JwtClaimTypes.GivenName,  givenName),
            new Claim(JwtClaimTypes.FamilyName, familyName)
        ]);

        logger.LogInformation("Seeder: created user '{Username}' with role '{Role}'.", username, role);
    }
}
