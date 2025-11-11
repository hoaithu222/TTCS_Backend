"use strict";
/**
 * @swagger
 * tags:
 *   - name: Product Attributes
 *     description: Quản lý biến thể/thuộc tính của sản phẩm
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProductAttributeRequest:
 *       type: object
 *       required: [productId, attributeTypeId, combination, price]
 *       properties:
 *         productId: { type: string }
 *         attributeTypeId: { type: string }
 *         combination:
 *           type: object
 *           additionalProperties: true
 *         price: { type: number }
 *         stock: { type: number }
 *         image_url: { type: string }
 *         barcode: { type: string }
 *     UpdateProductAttributeRequest:
 *       $ref: '#/components/schemas/CreateProductAttributeRequest'
 */
/**
 * @swagger
 * /product-attributes:
 *   get:
 *     summary: Danh sách thuộc tính sản phẩm
 *     tags: [Product Attributes]
 *   post:
 *     summary: Tạo thuộc tính sản phẩm (admin, shop)
 *     tags: [Product Attributes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductAttributeRequest'
 * /product-attributes/{id}:
 *   get:
 *     summary: Chi tiết thuộc tính sản phẩm
 *     tags: [Product Attributes]
 *   put:
 *     summary: Cập nhật thuộc tính sản phẩm (admin, shop)
 *     tags: [Product Attributes]
 *   delete:
 *     summary: Xóa thuộc tính sản phẩm (admin, shop)
 *     tags: [Product Attributes]
 */
