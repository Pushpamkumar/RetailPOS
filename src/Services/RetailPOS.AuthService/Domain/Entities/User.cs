using RetailPOS.Shared.Exceptions;

namespace RetailPOS.AuthService.Domain.Entities;

public class User
{
    public int UserId { get; private set; }
    public int StoreId { get; private set; }
    public string EmployeeCode { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? Mobile { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public int RoleId { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? LastLoginAt { get; private set; }

    public Role Role { get; private set; } = null!;
    public Store Store { get; private set; } = null!;
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();

    private User()
    {
    }

    public static User Create(
        int storeId,
        string employeeCode,
        string fullName,
        string? email,
        string? mobile,
        string passwordHash,
        int roleId)
    {
        if (string.IsNullOrWhiteSpace(employeeCode))
        {
            throw new DomainException("Employee code required");
        }

        return new User
        {
            StoreId = storeId,
            EmployeeCode = employeeCode,
            FullName = fullName,
            Email = email,
            Mobile = mobile,
            PasswordHash = passwordHash,
            RoleId = roleId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public void UpdateProfile(string fullName, string? email, string? mobile, int roleId, bool isActive)
    {
        FullName = fullName;
        Email = email;
        Mobile = mobile;
        RoleId = roleId;
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RecordLogin() => LastLoginAt = DateTime.UtcNow;

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;

    public void AddRefreshToken(RefreshToken token) => RefreshTokens.Add(token);
}
