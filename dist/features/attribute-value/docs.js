"use strict";
/**
 * @swagger
 * tags:
 *   - name: Attribute Values
 *     description: Quản lý giá trị thuộc tính
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     AttributeValue:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         attributeTypeId: { type: string }
 *         value: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateAttributeValueRequest:
 *       type: object
 *       required: [attributeTypeId, value]
 *       properties:
 *         attributeTypeId: { type: string }
 *         value: { type: string }
 *     UpdateAttributeValueRequest:
 *       $ref: '#/components/schemas/CreateAttributeValueRequest'
 *     PaginatedAttributeValues:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeValue' }
 *         meta:
 *           type: object
 *           properties:
 *             page: { type: integer }
 *             limit: { type: integer }
 *             total: { type: integer }
 *             totalPages: { type: integer }
 */
/**
 * @swagger
 * /attribute-values:
 *   get:
 *     summary: Danh sách giá trị thuộc tính
 *     tags: [Attribute Values]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: attributeTypeId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttributeValues'
 *   post:
 *     summary: Tạo giá trị thuộc tính (admin)
 *     tags: [Attribute Values]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttributeValueRequest'
 *     responses:
 *       201: { description: Tạo thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 * /attribute-values/{id}:
 *   get:
 *     summary: Chi tiết giá trị thuộc tính
 *     tags: [Attribute Values]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AttributeValue' }
 *       404: { description: Không tìm thấy }
 *   put:
 *     summary: Cập nhật giá trị thuộc tính (admin)
 *     tags: [Attribute Values]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateAttributeValueRequest' }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy }
 *   delete:
 *     summary: Xóa giá trị thuộc tính (admin)
 *     tags: [Attribute Values]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Xóa thành công }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy }
 */
