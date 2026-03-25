using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailPOS.CatalogService.Application.DTOs;
using RetailPOS.CatalogService.Application.Interfaces;
using RetailPOS.Shared.Api;
using RetailPOS.Shared.Security;

namespace RetailPOS.CatalogService.Controllers;

[ApiController]
[Route("catalog")]
[Authorize]
public class CatalogController(IProductService productService, IPromotionService promotionService) : ControllerBase
{
    [HttpGet("products/search")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<ProductSearchResultDto>>> Search([FromQuery] string? q, [FromQuery] int? categoryId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        => Ok(await productService.SearchAsync(new ProductSearchDto(q, categoryId, page, pageSize), cancellationToken));

    [HttpGet("products/{id:int}")]
    public async Task<ActionResult<ProductDetailDto>> GetById(int id, CancellationToken cancellationToken)
        => Ok(await productService.GetByIdAsync(id, cancellationToken));

    [HttpGet("products")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult> GetProducts([FromQuery] ProductFilterDto dto, CancellationToken cancellationToken)
        => Ok(await productService.GetPagedAsync(dto, cancellationToken));

    [HttpPost("products")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto, CancellationToken cancellationToken)
        => Ok(await productService.CreateAsync(dto, User.GetUserId(), cancellationToken));

    [HttpPut("products/{id:int}")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductDto dto, CancellationToken cancellationToken)
        => Ok(await productService.UpdateAsync(id, dto, User.GetUserId(), cancellationToken));

    [HttpDelete("products/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<ApiSuccessResponse>> Delete(int id, CancellationToken cancellationToken)
    {
        await productService.DeactivateAsync(id, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpGet("categories")]
    public async Task<ActionResult> Categories(CancellationToken cancellationToken)
        => Ok(await productService.GetCategoriesAsync(cancellationToken));

    [HttpPost("categories")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto, CancellationToken cancellationToken)
        => Ok(await productService.CreateCategoryAsync(dto, cancellationToken));

    [HttpGet("taxes")]
    public async Task<ActionResult> Taxes(CancellationToken cancellationToken)
        => Ok(await productService.GetActiveTaxConfigsAsync(cancellationToken));

    [HttpPost("taxes")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<TaxConfigDto>> CreateTax([FromBody] CreateTaxConfigDto dto, CancellationToken cancellationToken)
        => Ok(await productService.CreateTaxConfigAsync(dto, cancellationToken));

    [HttpGet("promotions/active")]
    public async Task<ActionResult> ActivePromotions(CancellationToken cancellationToken)
        => Ok(await promotionService.GetActivePromotionsAsync(cancellationToken));
}
