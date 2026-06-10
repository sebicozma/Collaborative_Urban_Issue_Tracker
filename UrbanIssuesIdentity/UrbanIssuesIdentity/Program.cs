using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using UrbanIssuesIdentity.Data;
using UrbanIssuesIdentity.Messaging;
using UrbanIssuesIdentity.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddControllers();

// ---- OpenAPI ---------------------------------------------------------------

builder.Services.AddOpenApi(options =>
{
    // Duende's OIDC endpoints live in middleware, not in endpoint routing,
    // so the built-in OpenAPI scanner can't see them. Inject them by hand.
    options.AddDocumentTransformer<OidcEndpointsDocumentTransformer>();
});

// ---- PostgreSQL / EF Core ---------------------------------------------------

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is not configured. " +
        "Set ConnectionStrings:DefaultConnection in appsettings.json or user-secrets.");

var migrationsAssembly = typeof(ApplicationDbContext).Assembly.FullName!;

void ConfigureDbContext(DbContextOptionsBuilder b) =>
    b.UseNpgsql(connectionString, sql => sql.MigrationsAssembly(migrationsAssembly));

// ASP.NET Identity uses this registration directly.
builder.Services.AddDbContext<ApplicationDbContext>(ConfigureDbContext);

// ---- ASP.NET Core Identity --------------------------------------------------

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;

        if (builder.Environment.IsDevelopment())
        {
            // Dev-friendly so the seeded alice/alice and bob/bob credentials work.
            // Tighten before production.
            options.Password.RequireDigit           = false;
            options.Password.RequireLowercase       = false;
            options.Password.RequireUppercase       = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength         = 4;
        }
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Point Identity's cookie at our own login/logout pages instead of the
// default scaffolded paths (/Identity/Account/Login etc.). This is what
// Duende's /connect/authorize and /connect/endsession will redirect to.
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath        = "/Account/Login";
    options.LogoutPath       = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
});

// ---- Messaging --------------------------------------------------------------

builder.Services
    .AddOptions<RabbitMqOptions>()
    .Bind(builder.Configuration.GetSection(RabbitMqOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton<IEventPublisher, RabbitMqEventPublisher>();

// ---- IdentityServer (DB-backed) --------------------------------------------

builder.Services
    .AddIdentityServer(options =>
    {
        // Pin the issuer so tokens validate identically whether identity is
        // reached via http://localhost:5222 (host) or http://urban-identity:5222
        // (inside the compose network).
        options.IssuerUri = "http://localhost:5222";

        options.Events.RaiseErrorEvents       = true;
        options.Events.RaiseInformationEvents = true;
        options.Events.RaiseFailureEvents     = true;
        options.Events.RaiseSuccessEvents     = true;

        options.EmitStaticAudienceClaim = true;
    })
    .AddConfigurationStore<ApplicationDbContext>(opt =>
    {
        opt.ConfigureDbContext = ConfigureDbContext;
    })
    .AddOperationalStore<ApplicationDbContext>(opt =>
    {
        opt.ConfigureDbContext = ConfigureDbContext;
    })
    .AddAspNetIdentity<ApplicationUser>()
    // Persist the dev signing key so container rebuilds don't rotate it and
    // invalidate every outstanding token. docker-compose points this at a
    // named volume (/app/keys); local runs keep the default location.
    .AddDeveloperSigningCredential(
        persistKey: true,
        filename: builder.Configuration["DevSigningKeyFile"] ?? "tempkey.jwk");

var app = builder.Build();

// ---- Seed (idempotent: applies migrations + creates missing data only) ------

await SeedData.EnsureSeededAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();

    // OpenAPI document at /openapi/v1.json + interactive API explorer at /scalar/v1
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options
            .WithTitle("Urban Issues Identity API")
            .WithTheme(ScalarTheme.BluePlanet)
            .WithDefaultHttpClient(ScalarTarget.Http, ScalarClient.Http11);
    });
}

app.UseStaticFiles();
app.UseRouting();

app.UseIdentityServer();

app.UseAuthorization();

// Razor Pages opt into authorization individually (Login/Logout are
// [AllowAnonymous]). A blanket RequireAuthorization here would lock
// users out of the login form.
app.MapRazorPages();
app.MapControllers();

app.Run();
