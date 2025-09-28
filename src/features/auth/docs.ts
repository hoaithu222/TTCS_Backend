/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Xác thực và quản lý tài khoản (đăng ký, đăng nhập, xác thực email, quên/đặt lại mật khẩu, OTP)
 *   - name: SocialAuth
 *     description: Đăng nhập thông qua mạng xã hội (Google, Facebook, GitHub)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiSuccess:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Success
 *         data:
 *           type: object
 *           nullable: true
 *         meta:
 *           type: object
 *           nullable: true
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T00:00:00.000Z
 *         code:
 *           type: integer
 *           example: 1
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error occurred
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         path:
 *           type: string
 *         method:
 *           type: string
 *         code:
 *           type: integer
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 661b1f6f2c7a3a0012a34bcd
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: https://example.com/avatar.jpg
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         role:
 *           type: string
 *           example: user
 *         accessToken:
 *           type: string
 *           nullable: true
 *         refreshToken:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LoginResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Đăng nhập thành công
 *         user:
 *           $ref: '#/components/schemas/User'
 *     RegisterResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Tạo tài khoản thành công
 *         user:
 *           $ref: '#/components/schemas/User'
 *     SimpleMessageData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Thao tác thành công
 *     SocialLoginResponseData:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Access token cấp cho phiên đăng nhập
 *         user:
 *           $ref: '#/components/schemas/User'
 *     RegisterUserRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Passw0rd!
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Passw0rd!
 *     ResendVerifyEmailRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, password, confirmPassword, identifier, otp]
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *         password:
 *           type: string
 *           format: password
 *           example: NewPassw0rd!
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: NewPassw0rd!
 *         identifier:
 *           type: string
 *           example: user@example.com
 *         otp:
 *           type: string
 *           example: "123456"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới bằng email và mật khẩu
 *     tags: [Auth]
 *     description: |
 *       - Tạo tài khoản mới và gửi email xác thực tới người dùng.
 *       - Tài khoản ở trạng thái inactive cho đến khi người dùng xác thực email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserRequest'
 *     responses:
 *       200:
 *         description: Đăng ký thành công, trả về thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RegisterResponseData'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Xác thực email bằng token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã xác thực được gửi qua email sau khi đăng ký
 *     responses:
 *       200:
 *         description: Xác thực email thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SimpleMessageData'
 *       400:
 *         description: Token không hợp lệ hoặc người dùng không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /auth/resend-verify-email:
 *   post:
 *     summary: Gửi lại email xác thực
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Gửi lại email xác thực thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SimpleMessageData'
 *       400:
 *         description: Email không tồn tại hoặc không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập bằng email và mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponseData'
 *       400:
 *         description: Thông tin đăng nhập không hợp lệ hoặc email chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Yêu cầu liên kết đặt lại mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Đã gửi liên kết đặt lại mật khẩu (nếu email tồn tại)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SimpleMessageData'
 *       400:
 *         description: Email không hợp lệ hoặc người dùng không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /otp/request:
 *   post:
 *     summary: Yêu cầu mã OTP cho một mục đích cụ thể
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, channel, purpose]
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               channel:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *               purpose:
 *                 type: string
 *                 example: login
 *     responses:
 *       200:
 *         description: Cấp mã OTP thành công
 */

/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Xác thực mã OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code, purpose]
 *             properties:
 *               identifier:
 *                 type: string
 *               code:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng token trong email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SimpleMessageData'
 *       400:
 *         description: Token không hợp lệ/hết hạn hoặc lỗi xác thực dữ liệu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /auth/social/google:
 *   get:
 *     summary: Điều hướng tới trang đăng nhập Google
 *     description: Khởi tạo OAuth2 flow với Google. Trình duyệt sẽ được chuyển hướng tới Google để cấp quyền.
 *     tags: [SocialAuth]
 *     responses:
 *       302:
 *         description: Chuyển hướng tới Google OAuth consent screen
 *       400:
 *         description: Cấu hình OAuth không hợp lệ
 *
 * /auth/social/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Google chuyển hướng về endpoint này sau khi người dùng cấp quyền. Hệ thống tạo access token và trả về người dùng.
 *     tags: [SocialAuth]
 *     responses:
 *       200:
 *         description: Đăng nhập Google thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SocialLoginResponseData'
 *       400:
 *         description: Không lấy được email hoặc xác thực thất bại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /auth/social/facebook:
 *   get:
 *     summary: Điều hướng tới trang đăng nhập Facebook
 *     description: Khởi tạo OAuth2 flow với Facebook. Trình duyệt sẽ được chuyển hướng tới Facebook để cấp quyền.
 *     tags: [SocialAuth]
 *     responses:
 *       302:
 *         description: Chuyển hướng tới Facebook OAuth consent screen
 *       400:
 *         description: Cấu hình OAuth không hợp lệ
 *
 * /auth/social/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     description: Facebook chuyển hướng về endpoint này sau khi người dùng cấp quyền. Hệ thống tạo access token và trả về người dùng.
 *     tags: [SocialAuth]
 *     responses:
 *       200:
 *         description: Đăng nhập Facebook thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SocialLoginResponseData'
 *       400:
 *         description: Không lấy được email hoặc xác thực thất bại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /auth/social/github:
 *   get:
 *     summary: Điều hướng tới trang đăng nhập GitHub
 *     description: Khởi tạo OAuth2 flow với GitHub. Trình duyệt sẽ được chuyển hướng tới GitHub để cấp quyền.
 *     tags: [SocialAuth]
 *     responses:
 *       302:
 *         description: Chuyển hướng tới GitHub OAuth consent screen
 *       400:
 *         description: Cấu hình OAuth không hợp lệ
 *
 * /auth/social/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: GitHub chuyển hướng về endpoint này sau khi người dùng cấp quyền. Hệ thống tạo access token và trả về người dùng.
 *     tags: [SocialAuth]
 *     responses:
 *       200:
 *         description: Đăng nhập GitHub thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SocialLoginResponseData'
 *       400:
 *         description: Không lấy được email hoặc xác thực thất bại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
