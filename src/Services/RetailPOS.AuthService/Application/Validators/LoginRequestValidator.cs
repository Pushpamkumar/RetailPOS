using FluentValidation;
using RetailPOS.AuthService.Application.DTOs;

namespace RetailPOS.AuthService.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}
