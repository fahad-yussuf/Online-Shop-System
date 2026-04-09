using FluentValidation;
using MarketplaceAPI.Controllers;

namespace MarketplaceAPI.Validators;

public class RegisterRequestValidator : AbstractValidator<AuthController.RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(r => r.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(r => r.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters");

        RuleFor(r => r.Name)
            .NotEmpty().WithMessage("Name is required");
    }
}