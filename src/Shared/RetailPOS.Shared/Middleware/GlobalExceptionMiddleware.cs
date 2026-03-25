using System.Diagnostics;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.Shared.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (PosApiException ex)
        {
            logger.LogWarning("Business error {Code}: {Message}", ex.ErrorCode, ex.Message);
            context.Response.StatusCode = ex.HttpStatus;
            await WriteErrorAsync(context, ex.ErrorCode, ex.Message);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            var errors = ex.Errors.Select(error => new { error.PropertyName, error.ErrorMessage });
            await WriteErrorAsync(context, "VALIDATION_ERROR", "Input validation failed", errors);
        }
        catch (DomainException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await WriteErrorAsync(context, "DOMAIN_ERROR", ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await WriteErrorAsync(context, "INTERNAL_ERROR", "An unexpected error occurred");
        }
    }

    private static Task WriteErrorAsync(HttpContext context, string code, string message, object? errors = null)
    {
        context.Response.ContentType = "application/problem+json";
        var payload = new
        {
            type = "about:blank",
            title = code,
            detail = message,
            status = context.Response.StatusCode,
            traceId = Activity.Current?.Id ?? context.TraceIdentifier,
            errors
        };
        return context.Response.WriteAsJsonAsync(payload);
    }
}
