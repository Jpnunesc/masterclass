using MasterClass.Application.Abstractions;
using Microsoft.AspNetCore.Identity;
using MasterClass.Domain.Entities;

namespace MasterClass.Infrastructure.Auth;

public sealed class PbkdfPasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<Student> _inner = new();
    private static readonly Student _placeholder = CreatePlaceholder();

    public string Hash(string password) => _inner.HashPassword(_placeholder, password);

    public bool Verify(string password, string hash)
    {
        var result = _inner.VerifyHashedPassword(_placeholder, hash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }

    private static Student CreatePlaceholder()
        => new("placeholder@masterclass.local", "placeholder", "placeholder-hash");
}
