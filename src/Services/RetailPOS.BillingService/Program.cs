using System.Security.Cryptography;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RetailPOS.BillingService.Application.Clients;
using RetailPOS.BillingService.Application.Interfaces;
using RetailPOS.BillingService.Application.Services;
using RetailPOS.BillingService.Infrastructure.Data;
using RetailPOS.BillingService.Infrastructure.Repositories;
using RetailPOS.Shared.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RetailPOS.BillingService",
        Version = "v1"
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document, null),
            new List<string>()
        }
    });
});
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddDbContext<BillingDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(3)));
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = LoadPublicKey(builder.Configuration["Jwt:PublicKeyPath"]!)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddHealthChecks().AddDbContextCheck<BillingDbContext>("billing-db");
builder.Services.AddHttpClient<IProductLookupClient, ProductLookupClient>(client =>
    client.BaseAddress = new Uri(builder.Configuration["Services:CatalogBaseUrl"]!));
builder.Services.AddHttpClient<IInventoryClient, InventoryClient>(client =>
    client.BaseAddress = new Uri(builder.Configuration["Services:AdminBaseUrl"]!));
builder.Services.AddScoped<IBillRepository, BillRepository>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<IBillNumberService, BillNumberService>();
builder.Services.AddScoped<IReceiptBuilder, ReceiptBuilder>();

var app = builder.Build();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.MapHealthChecks("/health");
app.MapControllers();
app.Run();

static SecurityKey LoadPublicKey(string publicKeyPath)
{
    using var rsa = RSA.Create();
    rsa.ImportFromPem(File.ReadAllText(publicKeyPath));
    return new RsaSecurityKey(rsa.ExportParameters(false));
}
