/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Quản lý sản phẩm
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProductRequest:
 *       type: object
 *       required: [name, images, shopId, subCategoryId, categoryId, price, warrantyInfo, dimensions, metaKeywords]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         shopId:
 *           type: string
 *         subCategoryId:
 *           type: string
 *         categoryId:
 *           type: string
 *         price:
 *           type: number
 *         discount:
 *           type: number
 *         stock:
 *           type: number
 *         warrantyInfo:
 *           type: string
 *         weight:
 *           type: number
 *         dimensions:
 *           type: string
 *         metaKeywords:
 *           type: string
 *         isActive:
 *           type: boolean
 *     UpdateProductRequest:
 *       $ref: '#/components/schemas/CreateProductRequest'
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Danh sách sản phẩm
 *     tags: [Products]
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
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, rating, salesCount, viewCount]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     summary: Tạo sản phẩm (admin)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Xem chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   put:
 *     summary: Cập nhật sản phẩm (admin)
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *     responses:
 *       200:
 *         description: Thành công
 *   delete:
 *     summary: Xóa sản phẩm (admin)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
