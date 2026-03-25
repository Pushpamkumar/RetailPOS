using Moq;
using RetailPOS.AuthService.Application.DTOs;
using RetailPOS.AuthService.Application.Interfaces;
using RetailPOS.AuthService.Application.Services;
using RetailPOS.AuthService.Domain.Entities;
using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.AuthService.Tests;

[TestFixture]
public class AuthServiceTests
{
    private Mock<IUserRepository> _userRepository = null!;
    private Mock<ITokenService> _tokenService = null!;
    private RetailPOS.AuthService.Application.Services.AuthService _sut = null!;

    [SetUp]
    public void Setup()
    {
        _userRepository = new Mock<IUserRepository>();
        _tokenService = new Mock<ITokenService>();
        _sut = new RetailPOS.AuthService.Application.Services.AuthService(_userRepository.Object, _tokenService.Object);
    }

    [Test]
    public async Task Login_ValidCredentials_ReturnsTokens()
    {
        var user = BuildUser("Pass@123");
        _userRepository.Setup(x => x.GetByEmailAsync("john@x.com", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _tokenService.Setup(x => x.GenerateRefreshToken()).Returns(("raw", "hashed", DateTime.UtcNow.AddHours(8)));
        _tokenService.Setup(x => x.GenerateAccessToken(user, null)).Returns("access-token");

        var result = await _sut.LoginAsync(new LoginRequestDto("john@x.com", "Pass@123"));

        Assert.That(result.AccessToken, Is.EqualTo("access-token"));
        Assert.That(result.RefreshToken, Is.EqualTo("raw"));
    }

    [Test]
    public void Login_WrongPassword_ThrowsAuth001()
    {
        var user = BuildUser("Correct@123");
        _userRepository.Setup(x => x.GetByEmailAsync("john@x.com", It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var ex = Assert.ThrowsAsync<PosApiException>(() => _sut.LoginAsync(new LoginRequestDto("john@x.com", "Wrong@123")));

        Assert.That(ex!.ErrorCode, Is.EqualTo(PosErrors.AUTH_001));
    }

    private static User BuildUser(string password)
    {
        var user = User.Create(1, "EMP001", "John Doe", "john@x.com", null, BCrypt.Net.BCrypt.HashPassword(password), 1);
        typeof(User).GetProperty(nameof(User.Role))!.SetValue(user, new Role { RoleId = 1, RoleName = "Cashier", IsActive = true });
        typeof(User).GetProperty(nameof(User.Store))!.SetValue(user, new Store { StoreId = 1, StoreCode = "STR001", StoreName = "Main Store", IsActive = true });
        return user;
    }
}
