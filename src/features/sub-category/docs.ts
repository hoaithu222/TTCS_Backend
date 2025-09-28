/**
 * @swagger
 * tags:
 *   - name: Sub Categories
 *     description: Quản lý danh mục con
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SubCategory:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         slug: { type: string }
 *         description: { type: string }
 *         categoryId: { type: string }
 *         isActive: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateSubCategoryRequest:
 *       type: object
 *       required: [name, categoryId]
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         categoryId: { type: string }
 *         isActive: { type: boolean }
 *     UpdateSubCategoryRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateSubCategoryRequest'
 *     PaginatedSubCategories:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/SubCategory' }
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
 * /sub-category:
 *   get:
 *     summary: Danh sách danh mục con (phân trang, lọc)
 *     tags: [Sub Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
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
 *               $ref: '#/components/schemas/PaginatedSubCategories'
 *   post:
 *     summary: Tạo danh mục con (admin)
 *     tags: [Sub Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSubCategoryRequest' }
 *     responses:
 *       201: { description: Tạo thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 *
 * /sub-category/{id}:
 *   get:
 *     summary: Chi tiết danh mục con
 *     tags: [Sub Categories]
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
 *             schema: { $ref: '#/components/schemas/SubCategory' }
 *       404: { description: Không tìm thấy }
 *   put:
 *     summary: Cập nhật danh mục con (admin)
 *     tags: [Sub Categories]
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
 *           schema: { $ref: '#/components/schemas/UpdateSubCategoryRequest' }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy }
 *   delete:
 *     summary: Xóa danh mục con (admin)
 *     tags: [Sub Categories]
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
