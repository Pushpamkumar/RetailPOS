using FluentValidation;
using RetailPOS.CatalogService.Application.DTOs;

namespace RetailPOS.CatalogService.Application.Validators;

public class CreateProductValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.SKU).NotEmpty().MaximumLength(50)
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("SKU must be uppercase alphanumeric");
        RuleFor(x => x.Barcode).MaximumLength(100)
            .Matches(@"^[0-9]+$").When(x => !string.IsNullOrWhiteSpace(x.Barcode))
            .WithMessage("Barcode must be numeric");
        RuleFor(x => x.ProductName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.MRP).GreaterThan(0);
        RuleFor(x => x.SellingPrice).GreaterThan(0).LessThanOrEqualTo(x => x.MRP);
        RuleFor(x => x.ReorderLevel).GreaterThanOrEqualTo(0);
    }
}
