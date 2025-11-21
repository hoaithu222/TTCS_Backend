"use strict";
/**
 * @swagger
 * tags:
 *   - name: Wishlist
 *     description: Quản lý danh sách yêu thích (Wishlist)
 */
/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách yêu thích thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       $ref: '#/components/schemas/Wishlist'
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /wishlist/{productId}:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thêm sản phẩm vào wishlist thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Sản phẩm đã có trong wishlist
 *       404:
 *         description: Sản phẩm không tồn tại
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Xóa sản phẩm khỏi wishlist thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Sản phẩm không có trong wishlist
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /wishlist/{productId}/check:
 *   get:
 *     summary: Kiểm tra sản phẩm có trong danh sách yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Kiểm tra thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isInWishlist:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /wishlist:
 *   delete:
 *     summary: Xóa toàn bộ danh sách yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa toàn bộ wishlist thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Wishlist không tồn tại
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         productId:
 *           type: string
 *         productName:
 *           type: string
 *         productImage:
 *           type: string
 *         productPrice:
 *           type: number
 *         productDiscount:
 *           type: number
 *         finalPrice:
 *           type: number
 *         shopId:
 *           type: string
 *         shopName:
 *           type: string
 *         addedAt:
 *           type: string
 *           format: date-time
 *     Wishlist:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *         itemCount:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
