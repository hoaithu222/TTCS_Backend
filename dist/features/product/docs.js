"use strict";
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
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Đánh giá sản phẩm (0-5), mặc định 0
 *         salesCount:
 *           type: number
 *           minimum: 0
 *           description: Số lượng đã bán, mặc định 0
 *         warrantyInfo:
 *           type: string
 *         weight:
 *           type: number
 *         dimensions:
 *           type: string
 *         metaKeywords:
 *           type: string
 *         viewCount:
 *           type: number
 *           minimum: 0
 *           description: Số lượt xem, mặc định 0
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
 *     summary: Tạo sản phẩm (admin, shop)
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
 *     summary: Cập nhật sản phẩm (admin, shop)
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
 *     summary: Xóa sản phẩm (admin, shop)
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
/**
 * @swagger
 * /products/{id}/reviews:
 *   get:
 *     summary: Danh sách đánh giá theo sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     summary: Tạo đánh giá (người mua)
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
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */ 
