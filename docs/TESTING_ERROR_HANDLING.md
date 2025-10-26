# Testing Error Handling

## Cách Test Error Handling System

### 1. Test Login Errors - Bypass Toast

#### Back-end trả về (ví dụ):

```json
{
  "success": false,
  "message": "Email không tồn tại",
  "skipToast": true,
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/auth/login",
  "method": "POST"
}
```

#### Front-end Behavior:

- ❌ **KHÔNG** hiện toast
- ✅ Error được throw để bạn handle inline trong form
- Bạn có thể display error message trong form field

#### Cách Test:

```typescript
try {
  await authApi.login({ email: "wrong@email.com", password: "wrong" });
} catch (error) {
  // No toast shown!
  // Display error inline
  setLoginError(error.message);
}
```

### 2. Test API Errors - Show Toast

#### Back-end trả về (ví dụ):

```json
{
  "success": false,
  "message": "Failed to delete product",
  "skipToast": false, // hoặc undefined
  "statusCode": 500,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Front-end Behavior:

- ✅ **HIỆN** toast với message "Failed to delete product"
- Error vẫn được throw để bạn có thể handle

#### Cách Test:

```typescript
try {
  await productsApi.delete(productId);
} catch (error) {
  // Toast shown automatically!
  console.log("Error handled:", error.message);
}
```

### 3. Test Authentication Errors (401/403) - Bypass Toast

#### Back-end trả về:

```json
{
  "success": false,
  "message": "Token expired",
  "skipToast": true, // Auto-set by error middleware
  "statusCode": 401
}
```

#### Front-end Behavior:

- ❌ **KHÔNG** hiện toast
- Token refresh được trigger automatically
- Nếu refresh fails → redirect to login

### 4. Test Network Errors

#### Scenario: API không response hoặc timeout

#### Front-end Behavior:

- ✅ Hiện toast: "Network error. Please check your connection."
- Error được throw để handle

### 5. Test Server Errors (500+)

#### Back-end trả về 500 Internal Server Error:

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

#### Front-end Behavior:

- ✅ Hiện toast: "Server error occurred. Please try again later."
- Error được throw

### 6. Test Logout Flow

#### Khi user logout:

1. Redux saga logout được trigger
2. API call đến `/auth/logout`
3. Tokens được clear từ localStorage
4. Redux state được reset
5. Redirect về trang đúng (home hoặc giữ nguyên)

#### Khi token refresh fails:

1. Clear tokens
2. Clear persist:root từ localStorage
3. Redirect to /login

## Debugging

### Enable Dev Mode Logging

Trong development mode, bạn sẽ thấy logs:

```javascript
[UserHttpClient] Response error: {...}
[UserHttpClient] Standard error response: {...}
[UserHttpClient] Showing toast for error: "Error message"
// hoặc
[UserHttpClient] Skipping toast for error: "Error message"
```

### Check Browser Console

Mở DevTools → Console để xem logs khi có error xảy ra.

### Common Issues

#### Toast không hiện

- ✅ Check xem `skipToast` có = true không
- ✅ Check response có format `{ success: false, ... }` không
- ✅ Check console logs để xem response data

#### Toast hiện mặc dù set `skipToast: true`

- ✅ Check xem response có đúng format không
- ✅ Check xem `skipToast` field có được parse đúng không
- ✅ Check console logs để debug

#### Logout không hoạt động đúng

- ✅ Check tokens có được clear không
- ✅ Check redirect có xảy ra không
- ✅ Check Redux state có được reset không

## Example Usage

### Component Using Error Handling

```typescript
import { useState } from "react";
import { useAuth } from "@/features/Auth/hooks/useAuth";

const LoginForm = () => {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { onSubmitLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    try {
      // Login errors will NOT show toast - you handle inline
      await onSubmitLogin({ email, password });
    } catch (error) {
      // No toast shown! Handle error inline
      if (error.message.includes("Email")) {
        setEmailError(error.message);
      } else if (error.message.includes("Mật khẩu")) {
        setPasswordError(error.message);
      } else {
        setEmailError(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" {...emailProps} />
      {emailError && <span className="error">{emailError}</span>}

      <input type="password" {...passwordProps} />
      {passwordError && <span className="error">{passwordError}</span>}

      <button type="submit">Login</button>
    </form>
  );
};
```

### Component Using Regular API (with toast)

```typescript
const ProductPage = () => {
  const handleDelete = async (id) => {
    try {
      await productsApi.delete(id);
      // If error, toast shows automatically
    } catch (error) {
      // Toast already shown!
      // You can still access error.message if needed
    }
  };
};
```
