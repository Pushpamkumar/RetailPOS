using FluentValidation;
using RetailPOS.AuthService.Application.DTOs;

namespace RetailPOS.AuthService.Application.Validators;

public class RegisterUserValidator : AbstractValidator<RegisterUserDto>
{
    public RegisterUserValidator()
    {
        RuleFor(x => x.StoreId).GreaterThan(0);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.EmployeeCode).NotEmpty().MaximumLength(50)
            .Matches(@"^[A-Z0-9-]+$").WithMessage("Employee code: uppercase alphanumeric only");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Mobile).Matches(@"^\+?[0-9]{10,15}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Mobile));
        RuleFor(x => x).Must(x => !string.IsNullOrWhiteSpace(x.Email) || !string.IsNullOrWhiteSpace(x.Mobile))
            .WithMessage("At least one of Email or Mobile is required");
        RuleFor(x => x.Password).MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password needs uppercase")
            .Matches(@"[0-9]").WithMessage("Password needs a digit")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password needs a special character");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password);
        RuleFor(x => x.RoleId).GreaterThan(0);
    }
}
