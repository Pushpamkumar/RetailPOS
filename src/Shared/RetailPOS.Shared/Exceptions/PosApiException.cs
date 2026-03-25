namespace RetailPOS.Shared.Exceptions;

public class PosApiException : Exception
{
    public PosApiException(string errorCode, int httpStatus, string message) : base(message)
    {
        ErrorCode = errorCode;
        HttpStatus = httpStatus;
    }

    public string ErrorCode { get; }

    public int HttpStatus { get; }
}
