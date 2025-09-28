/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Quản lý danh mục và phân trang, bao gồm danh mục con
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "663f2b9a12c3a4b5c6d7e8f9" }
 *         name: { type: string, example: "Điện thoại" }
 *         slug: { type: string, example: "dien-thoai" }
 *         description: { type: string, example: "Danh mục các dòng điện thoại" }
 *         parentId: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateCategoryRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         parentId: { type: string, nullable: true }
 *     UpdateCategoryRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateCategoryRequest'
 *     PaginatedCategories:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/Category' }
 *         meta:
 *           type: object
 *           properties:
 *             page: { type: integer, example: 1 }
 *             limit: { type: integer, example: 10 }
 *             total: { type: integer, example: 25 }
 *             totalPages: { type: integer, example: 3 }
 */

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Danh sách danh mục (phân trang)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Trang hiện tại (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *         description: Kích thước trang (mặc định 10)
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCategories'
 *   post:
 *     summary: Tạo danh mục (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCategoryRequest' }
 *     responses:
 *       201: { description: Tạo danh mục thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 *
 * /category/{id}:
 *   get:
 *     summary: Chi tiết danh mục
 *     tags: [Categories]
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
 *             schema: { $ref: '#/components/schemas/Category' }
 *       404: { description: Không tìm thấy }
 *   put:
 *     summary: Cập nhật danh mục (admin)
 *     tags: [Categories]
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
 *           schema: { $ref: '#/components/schemas/UpdateCategoryRequest' }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy }
 *   delete:
 *     summary: Xóa danh mục (admin)
 *     tags: [Categories]
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
 *
 * /category/{id}/sub-categories:
 *   get:
 *     summary: Danh sách danh mục con theo danh mục cha (phân trang)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */
