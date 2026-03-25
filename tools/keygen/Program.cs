using System.Security.Cryptography;

var basePath = args.Length > 0 ? Path.GetFullPath(args[0]) : Directory.GetCurrentDirectory();
var authKeysPath = Path.Combine(basePath, "src", "Services", "RetailPOS.AuthService", "keys");
Directory.CreateDirectory(authKeysPath);

using var rsa = RSA.Create(2048);

var privatePem = rsa.ExportRSAPrivateKeyPem();
var publicPem = rsa.ExportRSAPublicKeyPem();

File.WriteAllText(Path.Combine(authKeysPath, "private.pem"), privatePem);
File.WriteAllText(Path.Combine(authKeysPath, "public.pem"), publicPem);

string[] publicTargets =
[
    Path.Combine(basePath, "src", "Gateway", "RetailPOS.Gateway", "keys", "public.pem"),
    Path.Combine(basePath, "src", "Services", "RetailPOS.CatalogService", "keys", "public.pem"),
    Path.Combine(basePath, "src", "Services", "RetailPOS.BillingService", "keys", "public.pem"),
    Path.Combine(basePath, "src", "Services", "RetailPOS.AdminService", "keys", "public.pem")
];

foreach (var target in publicTargets)
{
    Directory.CreateDirectory(Path.GetDirectoryName(target)!);
    File.WriteAllText(target, publicPem);
}

Console.WriteLine("RSA keys generated successfully.");
