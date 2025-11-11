"use strict";
/**
 * @swagger
 * tags:
 *   - name: Addresses
 *     description: Quản lý địa chỉ giao hàng của người dùng
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAddressRequest:
 *       type: object
 *       required: [name, phone, addressDetail, district, city]
 *       properties:
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         addressDetail:
 *           type: string
 *         district:
 *           type: string
 *         city:
 *           type: string
 *         isDefault:
 *           type: boolean
 *     UpdateAddressRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         addressDetail:
 *           type: string
 *         district:
 *           type: string
 *         city:
 *           type: string
 *         isDefault:
 *           type: boolean
 */
/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Danh sách địa chỉ của người dùng hiện tại
 *     tags: [Addresses]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *   post:
 *     summary: Tạo địa chỉ mới
 *     tags: [Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAddressRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Addresses]
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
 *             $ref: '#/components/schemas/UpdateAddressRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
/**
 * @swagger
 * /addresses/{id}/default:
 *   post:
 *     summary: Đặt địa chỉ mặc định
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
