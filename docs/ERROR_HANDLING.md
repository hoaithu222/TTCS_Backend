# Error Handling System

## Overview

The API now returns a standardized error response format that allows the front-end to handle errors consistently across the application.

## Error Response Format

All error responses follow this structure:

```typescript
{
  success: false,
  message: string,
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path?: string;
  method?: string;
  code?: number;
  skipToast?: boolean; // Flag to skip toast notification in front-end
}
```

## Features

### 1. Standard Error Format

All errors return a consistent structure:

- `success`: Always `false` for errors
- `message`: Human-readable error message
- `errors`: Array of field-specific validation errors (optional)
- `timestamp`: ISO timestamp of when the error occurred
- `path`: API path that failed
- `method`: HTTP method used
- `code`: Numeric error code (optional)
- `skipToast`: Boolean flag to skip toast notification in front-end (optional)

### 2. Skip Toast Flag

The `skipToast` flag allows you to prevent automatic toast notifications for specific errors. This is useful for:

- **Login errors**: Errors should be displayed inline in the form, not via toast
- **Registration errors**: Similar to login, show errors in the form
- **Authentication errors (401/403)**: Automatically skipped by the middleware

### Usage Examples

#### Back-end: Returning an error with skipToast

```typescript
// In a controller
return ResponseUtil.error(
  res,
  result.message,
  result.status,
  undefined,
  req.path,
  req.method,
  result.code,
  true // skipToast = true to skip toast notification
);
```

#### Front-end: Handling errors in interceptor

The front-end automatically handles the error format:

```typescript
// Errors with skipToast = true will NOT show toast
// Errors with skipToast = false or undefined WILL show toast

try {
  const response = await authApi.login(credentials);
  // Handle success
} catch (error) {
  // Error will be thrown but no toast will be shown if skipToast = true
  // You can display it inline in the form instead
  setError(error.message);
}
```

### 3. Automatic Error Handling

The front-end interceptor automatically:

1. **Checks for standard error format**: If response has `success: false`, it treats it as an error
2. **Respects skipToast flag**: Only shows toast if `skipToast` is not `true`
3. **Creates standardized error object**: Converts to `ErrorData` format for consistent handling
4. **Handles network errors**: Shows appropriate toast for network failures (500+ status codes)

### 4. Default Behavior by Status Code

The error middleware automatically sets `skipToast = true` for:

- **401 Unauthorized**: Authentication errors
- **403 Forbidden**: Permission errors

This prevents toast notifications for auth-related errors, allowing you to handle them gracefully in the UI.

### 5. Login & Registration Errors

Login and registration controllers automatically set `skipToast = true` to allow inline error display:

```typescript
export const loginController = async (req, res) => {
  const result = await AuthService.login(req.body);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method,
      result.code,
      true // skipToast for login errors
    );
  }
  return ResponseUtil.success(res, result);
};
```

## Benefits

1. **Consistent Error Handling**: All errors follow the same structure
2. **Flexible Toast Control**: Choose when to show/hide toast notifications
3. **Better UX**: Allow inline error display in forms
4. **Easy Integration**: Front-end automatically handles the format
5. **Type Safety**: Full TypeScript support with proper types

## Migration Guide

### Back-end

No changes needed if using `ResponseUtil.error()`. Just add the `skipToast` parameter when needed:

```typescript
// Old
ResponseUtil.error(res, message, status);

// New (with skipToast)
ResponseUtil.error(res, message, status, errors, path, method, code, skipToast);
```

### Front-end

The interceptor automatically handles the new format. You can still catch errors as before:

```typescript
try {
  await api.someAction();
} catch (error) {
  // Error has the standard format
  console.log(error.message); // Human-readable message
  console.log(error.code); // Error code
}
```

## Best Practices

1. **Use skipToast for form errors**: Set `skipToast = true` for errors that should be displayed inline
2. **Use default behavior for API errors**: Let automatic toast handling work for general API errors
3. **Provide meaningful messages**: Always include clear, user-friendly error messages
4. **Use validation errors**: Return field-specific errors for better UX
