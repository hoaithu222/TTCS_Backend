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
 *     CreateAttributeValueRequest:
 *       type: object
 *       required: [attributeTypeId, value]
 *       properties:
 *         attributeTypeId: { type: string }
 *         value: { type: string }
 *     UpdateAttributeValueRequest:
 *       $ref: '#/components/schemas/CreateAttributeValueRequest'
 */

/**
 * @swagger
 * /attribute-values:
 *   get:
 *     summary: Danh sách giá trị thuộc tính
 *     tags: [Attribute Values]
 *   post:
 *     summary: Tạo giá trị thuộc tính (admin)
 *     tags: [Attribute Values]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttributeValueRequest'
 * /attribute-values/{id}:
 *   get:
 *     summary: Chi tiết giá trị thuộc tính
 *     tags: [Attribute Values]
 *   put:
 *     summary: Cập nhật giá trị thuộc tính (admin)
 *     tags: [Attribute Values]
 *   delete:
 *     summary: Xóa giá trị thuộc tính (admin)
 *     tags: [Attribute Values]
 */
