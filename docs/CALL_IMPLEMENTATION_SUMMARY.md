# Tóm Tắt Implementation Voice/Video Call

## Đã Hoàn Thành

### 1. Backend ✅

#### Socket Events (src/shared/config/socket.ts)

- ✅ `CALL_INITIATE`: Khởi tạo cuộc gọi
- ✅ `CALL_INCOMING`: Thông báo cuộc gọi đến
- ✅ `CALL_ANSWER`: Trả lời cuộc gọi
- ✅ `CALL_REJECT`: Từ chối cuộc gọi
- ✅ `CALL_END`: Kết thúc cuộc gọi
- ✅ `CALL_CANCEL`: Hủy cuộc gọi (trước khi trả lời)
- ✅ `CALL_RINGING`: Trạng thái đang đổ chuông
- ✅ `CALL_STATUS`: Cập nhật trạng thái cuộc gọi
- ✅ `CALL_OFFER`: WebRTC offer
- ✅ `CALL_ANSWER_SDP`: WebRTC answer
- ✅ `CALL_ICE_CANDIDATE`: ICE candidate exchange

#### Types (src/features/chat/types.ts)

- ✅ `CallType`: "voice" | "video"
- ✅ `CallStatus`: Các trạng thái cuộc gọi
- ✅ `CallMetadata`: Metadata cho cuộc gọi
- ✅ `CallInitiateRequest`, `CallAnswerRequest`, etc.

#### Socket Handlers (src/sockets/modules/chat.ts)

- ✅ Handler cho tất cả call events
- ✅ Tạo call message trong database
- ✅ Emit events đến đúng participants
- ✅ WebRTC signaling support

### 2. Frontend ✅

#### Socket Constants

- ✅ Đã cập nhật `SOCKET_EVENTS` trong cả `ttcs_fe_user` và `ttcs_fe_admin`
- ✅ Tất cả call events đã được thêm vào constants

## Cần Thực Hiện Tiếp

### 3. Frontend Implementation

#### A. Cài Đặt Thư Viện

```bash
# Trong cả 2 projects: ttcs_fe_user và ttcs_fe_admin
npm install simple-peer
# hoặc cho React Native
npm install react-native-webrtc
```

#### B. Tạo Call Service

Tạo file `src/shared/services/call.service.ts` trong cả 2 frontend projects:

- Service để quản lý call lifecycle
- Kết nối với socket để nhận/send call events
- Quản lý WebRTC peer connection
- Xử lý media streams (audio/video)

#### C. Tạo Call Components

Tạo các components:

1. `CallComponent.tsx`: Main call UI component
2. `IncomingCallModal.tsx`: Modal hiển thị khi có cuộc gọi đến
3. `ActiveCallView.tsx`: UI khi đang trong cuộc gọi
4. `CallControls.tsx`: Buttons điều khiển (answer, reject, end, mute, etc.)

#### D. Tích Hợp Vào Chat

Cập nhật `ChatWindow.tsx`:

- Thêm call buttons (voice/video)
- Tích hợp CallComponent
- Hiển thị call history từ messages

#### E. Styling

- Style cho call UI
- Responsive design
- Animations cho incoming call

## Luồng Hoạt Động

### 1. Initiate Call (User A)

```
User A clicks "Voice Call" button
  → CallService.initiateCall(conversationId, "voice")
  → Request getUserMedia (audio)
  → socket.emit(CALL_INITIATE, { conversationId, callType: "voice" })
  → Backend creates call message in DB
  → Backend emits CALL_INCOMING to User B
  → Backend emits CALL_RINGING to User A
```

### 2. Receive Call (User B)

```
Backend emits CALL_INCOMING to User B
  → CallService.onIncomingCall handler
  → Show IncomingCallModal
  → User B clicks "Answer"
  → CallService.answerCall(callId, conversationId)
  → Request getUserMedia
  → socket.emit(CALL_ANSWER)
  → Backend updates call status to "answered"
  → Backend emits CALL_STATUS to both users
```

### 3. WebRTC Connection

```
After CALL_ANSWER:
  → User A creates Peer (initiator: true)
  → User A creates offer
  → socket.emit(CALL_OFFER, { offer })
  → Backend forwards to User B
  → User B receives offer
  → User B creates Peer (initiator: false)
  → User B creates answer
  → socket.emit(CALL_ANSWER_SDP, { answer })
  → Backend forwards to User A
  → Both peers exchange ICE candidates
  → WebRTC connection established
  → Audio/Video streams flow peer-to-peer
```

### 4. End Call

```
User clicks "End Call"
  → CallService.endCall(callId, conversationId, duration)
  → socket.emit(CALL_END)
  → Backend updates call message with duration
  → Backend emits CALL_STATUS to both users
  → Both clients cleanup resources
  → Show call history in chat
```

## Testing Checklist

- [ ] User A có thể initiate voice call
- [ ] User B nhận được incoming call notification
- [ ] User B có thể answer call
- [ ] User B có thể reject call
- [ ] User A có thể cancel call trước khi được answer
- [ ] WebRTC connection được establish
- [ ] Audio stream hoạt động (voice call)
- [ ] Video stream hoạt động (video call)
- [ ] Call duration được tính đúng
- [ ] Call history được lưu trong chat messages
- [ ] Call status được cập nhật realtime
- [ ] Multiple calls cùng lúc được handle đúng
- [ ] Network errors được handle gracefully

## Lưu Ý Quan Trọng

1. **Permissions**: Cần request microphone/camera permissions
2. **HTTPS**: WebRTC yêu cầu HTTPS trong production (hoặc localhost)
3. **STUN/TURN**: Cần cấu hình STUN/TURN servers cho production
4. **Error Handling**: Xử lý các lỗi như:
   - User không grant permissions
   - Network issues
   - WebRTC connection failures
   - User offline
5. **Call State Management**: Quản lý state để tránh multiple calls cùng lúc
6. **Resource Cleanup**: Luôn cleanup media streams và peer connections

## Next Steps

1. Cài đặt `simple-peer` hoặc WebRTC library
2. Implement CallService theo hướng dẫn trong VOICE_VIDEO_CALL_SETUP.md
3. Tạo CallComponent với UI
4. Tích hợp vào ChatWindow
5. Test với 2 browsers/users
6. Fix bugs và optimize

## Tài Liệu Tham Khảo

- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [simple-peer Documentation](https://github.com/feross/simple-peer)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [VOICE_VIDEO_CALL_SETUP.md](./VOICE_VIDEO_CALL_SETUP.md) - Hướng dẫn chi tiết
