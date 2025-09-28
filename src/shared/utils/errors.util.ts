export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode: string;
  public errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errorCode: string = "INTERNAL_ERROR",
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 422, true, "VALIDATION_ERROR", errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, true, "NOT_FOUND");
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request",
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 400, true, "BAD_REQUEST", errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, true, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, true, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409, true, "CONFLICT");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, true, "TOO_MANY_REQUESTS");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database error") {
    super(message, 500, false, "DATABASE_ERROR");
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = "External service error") {
    super(message, 502, false, "EXTERNAL_SERVICE_ERROR");
  }
}

// OTP Related Errors
export class OTPExpiredError extends AppError {
  constructor(message: string = "OTP has expired") {
    super(message, 400, true, "OTP_EXPIRED");
  }
}

export class OTPInvalidError extends AppError {
  constructor(message: string = "Invalid OTP") {
    super(message, 400, true, "OTP_INVALID");
  }
}

export class OTPMaxAttemptsExceededError extends AppError {
  constructor(message: string = "Maximum OTP attempts exceeded") {
    super(message, 429, true, "OTP_MAX_ATTEMPTS_EXCEEDED");
  }
}

export class OTPRateLimitError extends AppError {
  constructor(
    message: string = "OTP rate limit exceeded, please try again later"
  ) {
    super(message, 429, true, "OTP_RATE_LIMIT_EXCEEDED");
  }
}

export class OTPAlreadySentError extends AppError {
  constructor(
    message: string = "OTP already sent, please wait before requesting another"
  ) {
    super(message, 400, true, "OTP_ALREADY_SENT");
  }
}

export class OTPNotSentError extends AppError {
  constructor(message: string = "No OTP was sent to this number/email") {
    super(message, 400, true, "OTP_NOT_SENT");
  }
}

// Authentication Related Errors
export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid credentials") {
    super(message, 401, true, "INVALID_CREDENTIALS");
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string = "Account is locked") {
    super(message, 423, true, "ACCOUNT_LOCKED");
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message: string = "Account is suspended") {
    super(message, 423, true, "ACCOUNT_SUSPENDED");
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message: string = "Email not verified") {
    super(message, 403, true, "EMAIL_NOT_VERIFIED");
  }
}

export class PhoneNotVerifiedError extends AppError {
  constructor(message: string = "Phone number not verified") {
    super(message, 403, true, "PHONE_NOT_VERIFIED");
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, 401, true, "TOKEN_EXPIRED");
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, 401, true, "TOKEN_INVALID");
  }
}

export class RefreshTokenExpiredError extends AppError {
  constructor(message: string = "Refresh token has expired") {
    super(message, 401, true, "REFRESH_TOKEN_EXPIRED");
  }
}

// User Related Errors
export class UserNotFoundError extends AppError {
  constructor(message: string = "User not found") {
    super(message, 404, true, "USER_NOT_FOUND");
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message: string = "User already exists") {
    super(message, 409, true, "USER_ALREADY_EXISTS");
  }
}

export class PasswordTooWeakError extends AppError {
  constructor(message: string = "Password is too weak") {
    super(message, 400, true, "PASSWORD_TOO_WEAK");
  }
}

export class PasswordMismatchError extends AppError {
  constructor(message: string = "Passwords do not match") {
    super(message, 400, true, "PASSWORD_MISMATCH");
  }
}

export class OldPasswordIncorrectError extends AppError {
  constructor(message: string = "Old password is incorrect") {
    super(message, 400, true, "OLD_PASSWORD_INCORRECT");
  }
}

// File Upload Errors
export class FileTooLargeError extends AppError {
  constructor(message: string = "File size exceeds limit") {
    super(message, 400, true, "FILE_TOO_LARGE");
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(message: string = "Invalid file type") {
    super(message, 400, true, "INVALID_FILE_TYPE");
  }
}

export class FileUploadFailedError extends AppError {
  constructor(message: string = "File upload failed") {
    super(message, 500, false, "FILE_UPLOAD_FAILED");
  }
}

// Payment Related Errors
export class PaymentFailedError extends AppError {
  constructor(message: string = "Payment failed") {
    super(message, 400, true, "PAYMENT_FAILED");
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string = "Insufficient funds") {
    super(message, 400, true, "INSUFFICIENT_FUNDS");
  }
}

export class PaymentMethodNotSupportedError extends AppError {
  constructor(message: string = "Payment method not supported") {
    super(message, 400, true, "PAYMENT_METHOD_NOT_SUPPORTED");
  }
}

// Notification Errors
export class NotificationFailedError extends AppError {
  constructor(message: string = "Failed to send notification") {
    super(message, 500, false, "NOTIFICATION_FAILED");
  }
}

export class EmailSendFailedError extends AppError {
  constructor(message: string = "Failed to send email") {
    super(message, 500, false, "EMAIL_SEND_FAILED");
  }
}

export class SMSSendFailedError extends AppError {
  constructor(message: string = "Failed to send SMS") {
    super(message, 500, false, "SMS_SEND_FAILED");
  }
}

// Rate Limiting Errors
export class LoginRateLimitError extends AppError {
  constructor(
    message: string = "Too many login attempts, please try again later"
  ) {
    super(message, 429, true, "LOGIN_RATE_LIMIT_EXCEEDED");
  }
}

export class RegistrationRateLimitError extends AppError {
  constructor(
    message: string = "Too many registration attempts, please try again later"
  ) {
    super(message, 429, true, "REGISTRATION_RATE_LIMIT_EXCEEDED");
  }
}

export class PasswordResetRateLimitError extends AppError {
  constructor(
    message: string = "Too many password reset attempts, please try again later"
  ) {
    super(message, 429, true, "PASSWORD_RESET_RATE_LIMIT_EXCEEDED");
  }
}

// Business Logic Errors
export class InsufficientPermissionsError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, true, "INSUFFICIENT_PERMISSIONS");
  }
}

export class ResourceInUseError extends AppError {
  constructor(message: string = "Resource is currently in use") {
    super(message, 409, true, "RESOURCE_IN_USE");
  }
}

export class MaintenanceModeError extends AppError {
  constructor(message: string = "Service is under maintenance") {
    super(message, 503, true, "MAINTENANCE_MODE");
  }
}

export class FeatureNotAvailableError extends AppError {
  constructor(message: string = "Feature not available") {
    super(message, 400, true, "FEATURE_NOT_AVAILABLE");
  }
}

// Network and Connection Errors
export class NetworkTimeoutError extends AppError {
  constructor(message: string = "Network timeout") {
    super(message, 504, false, "NETWORK_TIMEOUT");
  }
}

export class ConnectionRefusedError extends AppError {
  constructor(message: string = "Connection refused") {
    super(message, 503, false, "CONNECTION_REFUSED");
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, 503, false, "SERVICE_UNAVAILABLE");
  }
}
