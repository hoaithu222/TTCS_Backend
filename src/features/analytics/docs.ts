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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /analytics/timeseries/revenue:
 *   get:
 *     summary: Chuỗi thời gian doanh thu (ngày/tháng)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: granularity
 *         schema: { type: string, enum: [day, month] }
 *       - in: query
 *         name: shopId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 */

/**
 * @swagger
 * /analytics/top/products:
 *   get:
 *     summary: Top sản phẩm theo doanh thu/số lượng
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: shopId
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: subCategoryId
 *         schema: { type: string }
 *       - in: query
 *         name: metric
 *         schema: { type: string, enum: [revenue, quantity] }
 *     responses:
 *       200: { description: Thành công }
 */
/**
 * @swagger
 * /analytics/shops/{shopId}/top-products:
 *   get:
 *     summary: Top sản phẩm theo cửa hàng
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: subCategoryId
 *         schema: { type: string }
 *       - in: query
 *         name: metric
 *         schema: { type: string, enum: [revenue, quantity] }
 *     responses:
 *       200: { description: Thành công }
 */

/**
 * @swagger
 * /analytics/top/shops:
 *   get:
 *     summary: Top cửa hàng theo doanh thu (admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200: { description: Thành công }
 */

/**
 * @swagger
 * /analytics/orders/status-distribution:
 *   get:
 *     summary: Phân bố trạng thái đơn hàng (admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Thành công }
 */

/**
 * @swagger
 * /analytics/orders/aov:
 *   get:
 *     summary: Giá trị đơn hàng trung bình (AOV)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: shopId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 */
