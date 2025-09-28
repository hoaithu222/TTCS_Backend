/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Quản lý người dùng (xem chi tiết, cập nhật, xóa, liệt kê)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserRequest:
 *       type: object
 *       description: Dữ liệu cập nhật thông tin người dùng
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         fullName:
 *           type: string
 *         phone:
 *           type: string
 *         avatar:
 *           type: string
 *           format: uri
 *         address:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         role:
 *           type: string
 *           example: user
 *         twoFactorAuth:
 *           type: boolean
 *         twoFactorAuthSecret:
 *           type: string
 *     UserListResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Lấy danh sách người dùng thành công
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *     GetUserResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Lấy thông tin người dùng thành công
 *         user:
 *           $ref: '#/components/schemas/User'
 *     UpdateUserResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Cập nhật người dùng thành công
 *         user:
 *           $ref: '#/components/schemas/User'
 *     DeleteUserResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Xóa người dùng thành công
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     description: Trả về danh sách tất cả người dùng trong hệ thống.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserListResponseData'
 *       400:
 *         description: Yêu cầu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết người dùng
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Lấy thông tin người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GetUserResponseData'
 *       400:
 *         description: Người dùng không tồn tại hoặc yêu cầu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Cập nhật người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UpdateUserResponseData'
 *       400:
 *         description: Người dùng không tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Xóa người dùng
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DeleteUserResponseData'
 *       400:
 *         description: Người dùng không tồn tại hoặc yêu cầu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
