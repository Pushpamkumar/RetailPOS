namespace RetailPOS.CatalogService.Domain.Entities;

public class Category
{
    public int CategoryId { get; set; }
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
