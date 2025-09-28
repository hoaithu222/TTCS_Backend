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
 *     AttributeType:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         isActive: { type: boolean }
 *         is_multiple: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
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
 *     PaginatedAttributeTypes:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeType' }
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
 * /attribute-types:
 *   get:
 *     summary: Danh sách loại thuộc tính
 *     tags: [Attribute Types]
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
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttributeTypes'
 *   post:
 *     summary: Tạo loại thuộc tính (admin)
 *     tags: [Attribute Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttributeTypeRequest'
 *     responses:
 *       201: { description: Tạo thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 * /attribute-types/{id}:
 *   get:
 *     summary: Chi tiết loại thuộc tính
 *     tags: [Attribute Types]
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
 *             schema: { $ref: '#/components/schemas/AttributeType' }
 *       404: { description: Không tìm thấy }
 *   put:
 *     summary: Cập nhật loại thuộc tính (admin)
 *     tags: [Attribute Types]
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
 *           schema: { $ref: '#/components/schemas/UpdateAttributeTypeRequest' }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy }
 *   delete:
 *     summary: Xóa loại thuộc tính (admin)
 *     tags: [Attribute Types]
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
