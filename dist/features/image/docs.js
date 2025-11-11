"use strict";
/**
 * @swagger
 * tags:
 *   - name: Images
 *     description: Quản lý hình ảnh
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateImageRequest:
 *       type: object
 *       required: [url, publicId]
 *       properties:
 *         url: { type: string, format: uri }
 *         publicId: { type: string }
 *     UpdateImageRequest:
 *       $ref: '#/components/schemas/CreateImageRequest'
 *     UploadImageResponse:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 */
/**
 * @swagger
 * /images:
 *   get:
 *     summary: Danh sách hình ảnh
 *     tags: [Images]
 *   post:
 *     summary: Tạo ảnh (admin)
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateImageRequest'
 * /images/upload:
 *   post:
 *     summary: Tải ảnh lên Cloudinary
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tải ảnh thành công, trả về URL ảnh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadImageResponse'
 *       400:
 *         description: Thiếu file hoặc yêu cầu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized (thiếu/không hợp lệ token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Lỗi máy chủ hoặc cấu hình Cloudinary thiếu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 * /images/{id}:
 *   get:
 *     summary: Chi tiết ảnh
 *     tags: [Images]
 *   put:
 *     summary: Cập nhật ảnh (admin)
 *     tags: [Images]
 *   delete:
 *     summary: Xóa ảnh (admin)
 *     tags: [Images]
 */
