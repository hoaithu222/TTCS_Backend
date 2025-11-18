"use strict";
/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Quản lý thanh toán và các phương thức thanh toán
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "663f2b9a12c3a4b5c6d7e8f9" }
 *         orderId: { type: string, example: "663f2b9a12c3a4b5c6d7e8f0" }
 *         userId: { type: string, example: "663f2b9a12c3a4b5c6d7e8f1" }
 *         amount: { type: number, example: 500000 }
 *         currency: { type: string, example: "VND" }
 *         method: { type: string, enum: [cod, bank_transfer, credit_card, paypal, vnpay, momo, zalopay] }
 *         status: { type: string, enum: [pending, processing, completed, failed, cancelled, refunded] }
 *         transactionId: { type: string, nullable: true }
 *         gatewayResponse: { type: object, nullable: true }
 *         paidAt: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         id: { type: string, example: "vnpay" }
 *         name: { type: string, example: "VNPay" }
 *         type: { type: string, enum: [cod, bank_transfer, credit_card, paypal, vnpay, momo, zalopay] }
 *         isActive: { type: boolean, example: true }
 *         icon: { type: string, example: "vnpay" }
 *         description: { type: string, example: "Thanh toán qua cổng VNPay" }
 *
 *     CheckoutRequest:
 *       type: object
 *       required: [orderId, paymentMethod]
 *       properties:
 *         orderId: { type: string }
 *         paymentMethod: { type: string }
 *         returnUrl: { type: string, nullable: true }
 *         cancelUrl: { type: string, nullable: true }
 *
 *     CheckoutResponse:
 *       type: object
 *       properties:
 *         paymentId: { type: string }
 *         paymentUrl: { type: string, nullable: true }
 *         qrCode: { type: string, nullable: true }
 *         instructions: { type: string, nullable: true }
 *         expiresAt: { type: string, format: date-time, nullable: true }
 *
 *     PaymentStatusResponse:
 *       type: object
 *       properties:
 *         payment: { $ref: '#/components/schemas/Payment' }
 *         status: { type: string }
 *
 *     PaymentHistoryResponse:
 *       type: object
 *       properties:
 *         payments:
 *           type: array
 *           items: { $ref: '#/components/schemas/Payment' }
 *         pagination:
 *           type: object
 *           properties:
 *             page: { type: integer }
 *             limit: { type: integer }
 *             total: { type: integer }
 *             totalPages: { type: integer }
 */
/**
 * @swagger
 * /payments/methods:
 *   get:
 *     summary: Lấy danh sách phương thức thanh toán có sẵn
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     methods:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/PaymentMethod' }
 */
/**
 * @swagger
 * /payments/checkout:
 *   post:
 *     summary: Tạo thanh toán cho đơn hàng
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CheckoutRequest' }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/CheckoutResponse' }
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
/**
 * @swagger
 * /payments/status/{orderId}:
 *   get:
 *     summary: Lấy trạng thái thanh toán của đơn hàng
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/PaymentStatusResponse' }
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy thanh toán
 */
/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Lấy lịch sử thanh toán
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, completed, failed, cancelled, refunded] }
 *       - in: query
 *         name: method
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Payment' }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       401:
 *         description: Chưa đăng nhập
 */
