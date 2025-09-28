"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.ConnectionRefusedError = exports.NetworkTimeoutError = exports.FeatureNotAvailableError = exports.MaintenanceModeError = exports.ResourceInUseError = exports.InsufficientPermissionsError = exports.PasswordResetRateLimitError = exports.RegistrationRateLimitError = exports.LoginRateLimitError = exports.SMSSendFailedError = exports.EmailSendFailedError = exports.NotificationFailedError = exports.PaymentMethodNotSupportedError = exports.InsufficientFundsError = exports.PaymentFailedError = exports.FileUploadFailedError = exports.InvalidFileTypeError = exports.FileTooLargeError = exports.OldPasswordIncorrectError = exports.PasswordMismatchError = exports.PasswordTooWeakError = exports.UserAlreadyExistsError = exports.UserNotFoundError = exports.RefreshTokenExpiredError = exports.TokenInvalidError = exports.TokenExpiredError = exports.PhoneNotVerifiedError = exports.EmailNotVerifiedError = exports.AccountSuspendedError = exports.AccountLockedError = exports.InvalidCredentialsError = exports.OTPNotSentError = exports.OTPAlreadySentError = exports.OTPRateLimitError = exports.OTPMaxAttemptsExceededError = exports.OTPInvalidError = exports.OTPExpiredError = exports.ExternalServiceError = exports.DatabaseError = exports.TooManyRequestsError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true, errorCode = "INTERNAL_ERROR", errors) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errorCode = errorCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message = "Validation failed", errors) {
        super(message, 422, true, "VALIDATION_ERROR", errors);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, true, "NOT_FOUND");
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends AppError {
    constructor(message = "Bad request", errors) {
        super(message, 400, true, "BAD_REQUEST", errors);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, true, "UNAUTHORIZED");
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403, true, "FORBIDDEN");
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409, true, "CONFLICT");
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429, true, "TOO_MANY_REQUESTS");
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class DatabaseError extends AppError {
    constructor(message = "Database error") {
        super(message, 500, false, "DATABASE_ERROR");
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(message = "External service error") {
        super(message, 502, false, "EXTERNAL_SERVICE_ERROR");
    }
}
exports.ExternalServiceError = ExternalServiceError;
// OTP Related Errors
class OTPExpiredError extends AppError {
    constructor(message = "OTP has expired") {
        super(message, 400, true, "OTP_EXPIRED");
    }
}
exports.OTPExpiredError = OTPExpiredError;
class OTPInvalidError extends AppError {
    constructor(message = "Invalid OTP") {
        super(message, 400, true, "OTP_INVALID");
    }
}
exports.OTPInvalidError = OTPInvalidError;
class OTPMaxAttemptsExceededError extends AppError {
    constructor(message = "Maximum OTP attempts exceeded") {
        super(message, 429, true, "OTP_MAX_ATTEMPTS_EXCEEDED");
    }
}
exports.OTPMaxAttemptsExceededError = OTPMaxAttemptsExceededError;
class OTPRateLimitError extends AppError {
    constructor(message = "OTP rate limit exceeded, please try again later") {
        super(message, 429, true, "OTP_RATE_LIMIT_EXCEEDED");
    }
}
exports.OTPRateLimitError = OTPRateLimitError;
class OTPAlreadySentError extends AppError {
    constructor(message = "OTP already sent, please wait before requesting another") {
        super(message, 400, true, "OTP_ALREADY_SENT");
    }
}
exports.OTPAlreadySentError = OTPAlreadySentError;
class OTPNotSentError extends AppError {
    constructor(message = "No OTP was sent to this number/email") {
        super(message, 400, true, "OTP_NOT_SENT");
    }
}
exports.OTPNotSentError = OTPNotSentError;
// Authentication Related Errors
class InvalidCredentialsError extends AppError {
    constructor(message = "Invalid credentials") {
        super(message, 401, true, "INVALID_CREDENTIALS");
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class AccountLockedError extends AppError {
    constructor(message = "Account is locked") {
        super(message, 423, true, "ACCOUNT_LOCKED");
    }
}
exports.AccountLockedError = AccountLockedError;
class AccountSuspendedError extends AppError {
    constructor(message = "Account is suspended") {
        super(message, 423, true, "ACCOUNT_SUSPENDED");
    }
}
exports.AccountSuspendedError = AccountSuspendedError;
class EmailNotVerifiedError extends AppError {
    constructor(message = "Email not verified") {
        super(message, 403, true, "EMAIL_NOT_VERIFIED");
    }
}
exports.EmailNotVerifiedError = EmailNotVerifiedError;
class PhoneNotVerifiedError extends AppError {
    constructor(message = "Phone number not verified") {
        super(message, 403, true, "PHONE_NOT_VERIFIED");
    }
}
exports.PhoneNotVerifiedError = PhoneNotVerifiedError;
class TokenExpiredError extends AppError {
    constructor(message = "Token has expired") {
        super(message, 401, true, "TOKEN_EXPIRED");
    }
}
exports.TokenExpiredError = TokenExpiredError;
class TokenInvalidError extends AppError {
    constructor(message = "Invalid token") {
        super(message, 401, true, "TOKEN_INVALID");
    }
}
exports.TokenInvalidError = TokenInvalidError;
class RefreshTokenExpiredError extends AppError {
    constructor(message = "Refresh token has expired") {
        super(message, 401, true, "REFRESH_TOKEN_EXPIRED");
    }
}
exports.RefreshTokenExpiredError = RefreshTokenExpiredError;
// User Related Errors
class UserNotFoundError extends AppError {
    constructor(message = "User not found") {
        super(message, 404, true, "USER_NOT_FOUND");
    }
}
exports.UserNotFoundError = UserNotFoundError;
class UserAlreadyExistsError extends AppError {
    constructor(message = "User already exists") {
        super(message, 409, true, "USER_ALREADY_EXISTS");
    }
}
exports.UserAlreadyExistsError = UserAlreadyExistsError;
class PasswordTooWeakError extends AppError {
    constructor(message = "Password is too weak") {
        super(message, 400, true, "PASSWORD_TOO_WEAK");
    }
}
exports.PasswordTooWeakError = PasswordTooWeakError;
class PasswordMismatchError extends AppError {
    constructor(message = "Passwords do not match") {
        super(message, 400, true, "PASSWORD_MISMATCH");
    }
}
exports.PasswordMismatchError = PasswordMismatchError;
class OldPasswordIncorrectError extends AppError {
    constructor(message = "Old password is incorrect") {
        super(message, 400, true, "OLD_PASSWORD_INCORRECT");
    }
}
exports.OldPasswordIncorrectError = OldPasswordIncorrectError;
// File Upload Errors
class FileTooLargeError extends AppError {
    constructor(message = "File size exceeds limit") {
        super(message, 400, true, "FILE_TOO_LARGE");
    }
}
exports.FileTooLargeError = FileTooLargeError;
class InvalidFileTypeError extends AppError {
    constructor(message = "Invalid file type") {
        super(message, 400, true, "INVALID_FILE_TYPE");
    }
}
exports.InvalidFileTypeError = InvalidFileTypeError;
class FileUploadFailedError extends AppError {
    constructor(message = "File upload failed") {
        super(message, 500, false, "FILE_UPLOAD_FAILED");
    }
}
exports.FileUploadFailedError = FileUploadFailedError;
// Payment Related Errors
class PaymentFailedError extends AppError {
    constructor(message = "Payment failed") {
        super(message, 400, true, "PAYMENT_FAILED");
    }
}
exports.PaymentFailedError = PaymentFailedError;
class InsufficientFundsError extends AppError {
    constructor(message = "Insufficient funds") {
        super(message, 400, true, "INSUFFICIENT_FUNDS");
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class PaymentMethodNotSupportedError extends AppError {
    constructor(message = "Payment method not supported") {
        super(message, 400, true, "PAYMENT_METHOD_NOT_SUPPORTED");
    }
}
exports.PaymentMethodNotSupportedError = PaymentMethodNotSupportedError;
// Notification Errors
class NotificationFailedError extends AppError {
    constructor(message = "Failed to send notification") {
        super(message, 500, false, "NOTIFICATION_FAILED");
    }
}
exports.NotificationFailedError = NotificationFailedError;
class EmailSendFailedError extends AppError {
    constructor(message = "Failed to send email") {
        super(message, 500, false, "EMAIL_SEND_FAILED");
    }
}
exports.EmailSendFailedError = EmailSendFailedError;
class SMSSendFailedError extends AppError {
    constructor(message = "Failed to send SMS") {
        super(message, 500, false, "SMS_SEND_FAILED");
    }
}
exports.SMSSendFailedError = SMSSendFailedError;
// Rate Limiting Errors
class LoginRateLimitError extends AppError {
    constructor(message = "Too many login attempts, please try again later") {
        super(message, 429, true, "LOGIN_RATE_LIMIT_EXCEEDED");
    }
}
exports.LoginRateLimitError = LoginRateLimitError;
class RegistrationRateLimitError extends AppError {
    constructor(message = "Too many registration attempts, please try again later") {
        super(message, 429, true, "REGISTRATION_RATE_LIMIT_EXCEEDED");
    }
}
exports.RegistrationRateLimitError = RegistrationRateLimitError;
class PasswordResetRateLimitError extends AppError {
    constructor(message = "Too many password reset attempts, please try again later") {
        super(message, 429, true, "PASSWORD_RESET_RATE_LIMIT_EXCEEDED");
    }
}
exports.PasswordResetRateLimitError = PasswordResetRateLimitError;
// Business Logic Errors
class InsufficientPermissionsError extends AppError {
    constructor(message = "Insufficient permissions") {
        super(message, 403, true, "INSUFFICIENT_PERMISSIONS");
    }
}
exports.InsufficientPermissionsError = InsufficientPermissionsError;
class ResourceInUseError extends AppError {
    constructor(message = "Resource is currently in use") {
        super(message, 409, true, "RESOURCE_IN_USE");
    }
}
exports.ResourceInUseError = ResourceInUseError;
class MaintenanceModeError extends AppError {
    constructor(message = "Service is under maintenance") {
        super(message, 503, true, "MAINTENANCE_MODE");
    }
}
exports.MaintenanceModeError = MaintenanceModeError;
class FeatureNotAvailableError extends AppError {
    constructor(message = "Feature not available") {
        super(message, 400, true, "FEATURE_NOT_AVAILABLE");
    }
}
exports.FeatureNotAvailableError = FeatureNotAvailableError;
// Network and Connection Errors
class NetworkTimeoutError extends AppError {
    constructor(message = "Network timeout") {
        super(message, 504, false, "NETWORK_TIMEOUT");
    }
}
exports.NetworkTimeoutError = NetworkTimeoutError;
class ConnectionRefusedError extends AppError {
    constructor(message = "Connection refused") {
        super(message, 503, false, "CONNECTION_REFUSED");
    }
}
exports.ConnectionRefusedError = ConnectionRefusedError;
class ServiceUnavailableError extends AppError {
    constructor(message = "Service temporarily unavailable") {
        super(message, 503, false, "SERVICE_UNAVAILABLE");
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
