param(
    [string]$GatewayBaseUrl = "http://localhost:5000",
    [string]$AdminEmail = "admin@retailpos.com",
    [string]$AdminPassword = "Admin@123"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Ok {
    param(
        [bool]$Condition,
        [string]$Success,
        [string]$Failure
    )

    if ($Condition) {
        Write-Host "[PASS] $Success" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] $Failure" -ForegroundColor Red
    }
}

Write-Step "Logging in through gateway"
$loginBody = @{
    username = $AdminEmail
    password = $AdminPassword
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "$GatewayBaseUrl/gateway/auth/login" -ContentType "application/json" -Body $loginBody
$token = $login.accessToken
Assert-Ok ($null -ne $token -and $token.Length -gt 20) "Login returned a JWT." "Login did not return a usable token."

$headers = @{
    Authorization = "Bearer $token"
}

Write-Step "Checking core read APIs"
$dashboard = Invoke-RestMethod -Method Get -Uri "$GatewayBaseUrl/gateway/admin/dashboard?storeId=1" -Headers $headers
Assert-Ok ($null -ne $dashboard) "Dashboard API responded." "Dashboard API did not respond."

$users = Invoke-RestMethod -Method Get -Uri "$GatewayBaseUrl/gateway/auth/users?storeId=1&page=1&pageSize=20" -Headers $headers
Assert-Ok ($null -ne $users.items) "Users list API responded." "Users list API failed."

$categories = Invoke-RestMethod -Method Get -Uri "$GatewayBaseUrl/gateway/catalog/categories" -Headers $headers
Assert-Ok ($null -ne $categories) "Categories API responded." "Categories API failed."

$taxes = Invoke-RestMethod -Method Get -Uri "$GatewayBaseUrl/gateway/catalog/taxes" -Headers $headers
Assert-Ok ($null -ne $taxes) "Taxes API responded." "Taxes API failed."

Write-Step "Checking write APIs"
$stamp = Get-Date -Format "yyyyMMddHHmmss"

$categoryBody = @{
    categoryCode = "CAT$stamp"
    categoryName = "Category $stamp"
    parentCategoryId = $null
    sortOrder = 1
} | ConvertTo-Json

try {
    $newCategory = Invoke-RestMethod -Method Post -Uri "$GatewayBaseUrl/gateway/catalog/categories" -Headers $headers -ContentType "application/json" -Body $categoryBody
    Assert-Ok ($null -ne $newCategory.categoryId) "Create category succeeded." "Create category did not return an id."
}
catch {
    Write-Host "[FAIL] Create category failed: $($_.Exception.Message)" -ForegroundColor Red
}

$taxBody = @{
    taxCode = "TX$stamp"
    taxName = "Tax $stamp"
    taxRate = 5
    isTaxInclusive = $false
    effectiveFrom = (Get-Date -Format "yyyy-MM-dd")
} | ConvertTo-Json

try {
    $newTax = Invoke-RestMethod -Method Post -Uri "$GatewayBaseUrl/gateway/catalog/taxes" -Headers $headers -ContentType "application/json" -Body $taxBody
    Assert-Ok ($null -ne $newTax.taxId) "Create tax succeeded." "Create tax did not return an id."
}
catch {
    Write-Host "[FAIL] Create tax failed: $($_.Exception.Message)" -ForegroundColor Red
}

$userBody = @{
    storeId = 1
    employeeCode = "EMP$stamp"
    fullName = "Smoke Test User"
    email = "smoke$stamp@test.local"
    mobile = $null
    password = "Admin@123"
    confirmPassword = "Admin@123"
    roleId = 1
} | ConvertTo-Json

try {
    $newUser = Invoke-RestMethod -Method Post -Uri "$GatewayBaseUrl/gateway/auth/register" -Headers $headers -ContentType "application/json" -Body $userBody
    Assert-Ok ($null -ne $newUser.userId) "Create user succeeded." "Create user did not return an id."
}
catch {
    Write-Host "[FAIL] Create user failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Step "Smoke test complete"
