# Voice/Video Call Feature - Tóm Tắt Nhanh

## 📋 Tổng Quan

Tính năng gọi thoại và video call đã được cấu hình ở backend, tương tự như cách message được xử lý. Frontend cần implement phần UI và WebRTC connection.

## ✅ Đã Hoàn Thành (Backend)

### 1. Socket Events

File: `src/shared/config/socket.ts`

- Đã thêm 11 socket events cho call management và WebRTC signaling

### 2. Types & Interfaces

File: `src/features/chat/types.ts`

- `CallType`, `CallStatus`, `CallMetadata`
- Request interfaces: `CallInitiateRequest`, `CallAnswerRequest`, etc.

### 3. Socket Handlers

File: `src/sockets/modules/chat.ts`

- Handlers cho tất cả call events
- Tự động tạo call message trong database
- Routing events đến đúng participants

### 4. Frontend Socket Constants

Files:

- `ttcs_fe_user/src/core/socket/constants.ts`
- `ttcs_fe_admin/src/core/socket/constants.ts`
- Đã cập nhật `SOCKET_EVENTS` với tất cả call events

## 📝 Cần Làm Tiếp (Frontend)

### Bước 1: Cài đặt thư viện

```bash
npm install simple-peer
```

### Bước 2: Tạo Call Service

Xem chi tiết trong `VOICE_VIDEO_CALL_SETUP.md` phần "Tạo Call Service"

### Bước 3: Tạo Call Component

Xem chi tiết trong `VOICE_VIDEO_CALL_SETUP.md` phần "Tạo Call Component"

### Bước 4: Tích hợp vào Chat

Thêm call buttons vào `ChatWindow.tsx`

## 🔄 Luồng Hoạt Động

1. **User A initiate call** → Backend tạo call message → User B nhận CALL_INCOMING
2. **User B answer** → Backend update status → WebRTC signaling bắt đầu
3. **WebRTC connection** → Peer-to-peer audio/video streams
4. **End call** → Backend lưu duration → Call history trong chat

## 📚 Tài Liệu

- **Chi tiết implementation**: `VOICE_VIDEO_CALL_SETUP.md`
- **Tóm tắt implementation**: `CALL_IMPLEMENTATION_SUMMARY.md`
- **File này**: Overview nhanh

## ⚠️ Lưu Ý

1. Cần HTTPS trong production (hoặc localhost cho dev)
2. Cần request microphone/camera permissions
3. Cần STUN/TURN servers cho production
4. Test với 2 browsers/users khác nhau

## 🚀 Quick Start

1. Đọc `VOICE_VIDEO_CALL_SETUP.md` để hiểu chi tiết
2. Cài đặt `simple-peer`
3. Copy CallService code từ hướng dẫn
4. Tạo CallComponent
5. Tích hợp vào ChatWindow
6. Test!
