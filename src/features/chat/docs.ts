/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Quản lý chat và tin nhắn (Chat & Messages)
 */

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Lấy danh sách cuộc trò chuyện
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng cuộc trò chuyện mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [direct, group, admin, shop, ai]
 *         description: Lọc theo loại cuộc trò chuyện
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [admin, shop, ai]
 *         description: Lọc theo kênh
 *     responses:
 *       200:
 *         description: Lấy danh sách cuộc trò chuyện thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ConversationListResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /chat/conversations/{id}:
 *   get:
 *     summary: Lấy chi tiết cuộc trò chuyện
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cuộc trò chuyện
 *     responses:
 *       200:
 *         description: Lấy chi tiết cuộc trò chuyện thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatConversation'
 *       404:
 *         description: Cuộc trò chuyện không tồn tại
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /chat/conversations/{id}/messages:
 *   get:
 *     summary: Lấy danh sách tin nhắn trong cuộc trò chuyện
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cuộc trò chuyện
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng tin nhắn mỗi trang
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Lấy tin nhắn trước messageId này
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Lấy tin nhắn sau messageId này
 *     responses:
 *       200:
 *         description: Lấy danh sách tin nhắn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MessageListResponse'
 *       404:
 *         description: Cuộc trò chuyện không tồn tại
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Gửi tin nhắn trong cuộc trò chuyện
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cuộc trò chuyện
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Gửi tin nhắn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       404:
 *         description: Cuộc trò chuyện không tồn tại
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /chat/conversations/{id}/read:
 *   patch:
 *     summary: Đánh dấu cuộc trò chuyện đã đọc
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cuộc trò chuyện
 *     responses:
 *       200:
 *         description: Đánh dấu đã đọc thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Cuộc trò chuyện không tồn tại
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /chat/conversations/{id}/delivered:
 *   patch:
 *     summary: Đánh dấu cuộc trò chuyện đã gửi
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cuộc trò chuyện
 *     responses:
 *       200:
 *         description: Đánh dấu đã gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Cuộc trò chuyện không tồn tại
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         conversationId:
 *           type: string
 *         senderId:
 *           type: string
 *         senderName:
 *           type: string
 *         senderAvatar:
 *           type: string
 *         message:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *         metadata:
 *           type: object
 *         isRead:
 *           type: boolean
 *         isDelivered:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatConversation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *               role:
 *                 type: string
 *         lastMessage:
 *           $ref: '#/components/schemas/ChatMessage'
 *         unreadCount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [direct, group, admin, shop, ai]
 *         channel:
 *           type: string
 *           enum: [admin, shop, ai]
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ConversationListResponse:
 *       type: object
 *       properties:
 *         conversations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatConversation'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             totalPages:
 *               type: number
 *     MessageListResponse:
 *       type: object
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             totalPages:
 *               type: number
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *         metadata:
 *           type: object
 */

