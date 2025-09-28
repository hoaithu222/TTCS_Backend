/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Đánh giá sản phẩm/cửa hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReviewRequest:
 *       type: object
 *       required: [productId, shopId, rating]
 *       properties:
 *         productId:
 *           type: string
 *         shopId:
 *           type: string
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *     UpdateReviewRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Danh sách đánh giá (lọc theo productId/shopId)
 *     tags: [Reviews]
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
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *   post:
 *     summary: Tạo đánh giá
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Chi tiết đánh giá
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *   put:
 *     summary: Cập nhật đánh giá (chủ sở hữu)
 *     tags: [Reviews]
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
 *             $ref: '#/components/schemas/UpdateReviewRequest'
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *   delete:
 *     summary: Xóa đánh giá (chủ sở hữu)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
