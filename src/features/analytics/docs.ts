/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Số liệu doanh thu
 */

/**
 * @swagger
 * /analytics/admin/revenue:
 *   get:
 *     summary: Doanh thu tổng (admin)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /analytics/shops/{shopId}/revenue:
 *   get:
 *     summary: Doanh thu theo cửa hàng (admin, shop)
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
