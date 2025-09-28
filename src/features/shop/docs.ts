/**
 * @swagger
 * tags:
 *   - name: Shops
 *     description: Quản lý cửa hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateShopRequest:
 *       type: object
 *       required: [userId, name, description, logo, banner]
 *       properties:
 *         userId: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         logo: { type: string }
 *         banner: { type: string }
 *     UpdateShopRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateShopRequest'
 *         - type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [pending, active, blocked]
 *             rating:
 *               type: number
 *     ListShopQuery:
 *       type: object
 *       properties:
 *         page: { type: integer }
 *         limit: { type: integer }
 *         userId: { type: string }
 *         search: { type: string }
 *         status:
 *           type: string
 *           enum: [pending, active, blocked]
 */

/**
 * @swagger
 * /shops:
 *   get:
 *     summary: Danh sách cửa hàng
 *     tags: [Shops]
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     summary: Tạo cửa hàng (admin)
 *     tags: [Shops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShopRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */

/**
 * @swagger
 * /shops/{id}:
 *   get:
 *     summary: Chi tiết cửa hàng
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *   put:
 *     summary: Cập nhật cửa hàng (admin)
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShopRequest'
 *   delete:
 *     summary: Xóa cửa hàng (admin)
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
