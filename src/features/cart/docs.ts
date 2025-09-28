/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Quản lý giỏ hàng của người dùng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AddCartItemRequest:
 *       type: object
 *       required: [productId, variantId, quantity, priceAtTime, shopId]
 *       properties:
 *         productId:
 *           type: string
 *         variantId:
 *           type: string
 *         quantity:
 *           type: number
 *         priceAtTime:
 *           type: number
 *         shopId:
 *           type: string
 *     UpdateCartItemRequest:
 *       type: object
 *       properties:
 *         quantity:
 *           type: number
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng hiện tại
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Xóa giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCartItemRequest'
 *     responses:
 *       200:
 *         description: Thêm sản phẩm thành công
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
 * /cart/items/{itemId}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
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
 */
