/**
 * @swagger
 * tags:
 *   - name: Attribute Types
 *     description: Quản lý loại thuộc tính sản phẩm
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAttributeTypeRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         isActive: { type: boolean }
 *         is_multiple: { type: boolean }
 *     UpdateAttributeTypeRequest:
 *       $ref: '#/components/schemas/CreateAttributeTypeRequest'
 */

/**
 * @swagger
 * /attribute-types:
 *   get:
 *     summary: Danh sách loại thuộc tính
 *     tags: [Attribute Types]
 *   post:
 *     summary: Tạo loại thuộc tính (admin)
 *     tags: [Attribute Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttributeTypeRequest'
 * /attribute-types/{id}:
 *   get:
 *     summary: Chi tiết loại thuộc tính
 *     tags: [Attribute Types]
 *   put:
 *     summary: Cập nhật loại thuộc tính (admin)
 *     tags: [Attribute Types]
 *   delete:
 *     summary: Xóa loại thuộc tính (admin)
 *     tags: [Attribute Types]
 */
