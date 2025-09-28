/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Quản lý đơn hàng (tạo, xem, cập nhật, đổi trạng thái)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         variantId:
 *           type: string
 *         quantity:
 *           type: number
 *         price:
 *           type: number
 *         totalPrice:
 *           type: number
 *         discount:
 *           type: number
 *         tax:
 *           type: number
 *     CreateOrderRequest:
 *       type: object
 *       required: [shopId, addressId, paymentMethod, shippingFee, items]
 *       properties:
 *         shopId:
 *           type: string
 *         addressId:
 *           type: string
 *         paymentMethod:
 *           type: string
 *           example: COD
 *         shippingFee:
 *           type: number
 *         notes:
 *           type: string
 *         voucherId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     UpdateOrderRequest:
 *       type: object
 *       properties:
 *         addressId:
 *           type: string
 *         shippingFee:
 *           type: number
 *         notes:
 *           type: string
 *         trackingNumber:
 *           type: string
 *         courierName:
 *           type: string
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description:
 *           type: string
 *     OrderListResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Lấy danh sách đơn hàng thành công
 *         orders:
 *           type: array
 *           items:
 *             type: object
 *     GetOrderResponseData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         order:
 *           type: object
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Danh sách đơn hàng
 *     description: Admin xem tất cả, người dùng chỉ xem đơn của mình
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Chỉ áp dụng cho admin
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OrderListResponseData'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   post:
 *     summary: Tạo đơn hàng
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Xem chi tiết đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Cập nhật thông tin đơn hàng
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/UpdateOrderRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Xóa đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
