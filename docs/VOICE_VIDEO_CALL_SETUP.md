# Hướng Dẫn Cấu Hình Voice/Video Call

Tài liệu này hướng dẫn cách cấu hình và tích hợp tính năng gọi thoại (voice/video call) vào hệ thống chat, tương tự như cách message được xử lý.

## Tổng Quan

Hệ thống đã được cấu hình để hỗ trợ voice/video call với:

- **Backend**: Socket.IO events cho signaling và call management
- **WebRTC**: Peer-to-peer communication cho voice/video
- **Database**: Lưu trữ call history như message

## Kiến Trúc

```
User A (Initiator)          Backend (Signaling)          User B (Receiver)
     |                              |                           |
     |-- CALL_INITIATE ----------->|                           |
     |                              |-- CALL_INCOMING -------->|
     |                              |                           |
     |<-- CALL_RINGING -------------|                           |
     |                              |<-- CALL_ANSWER ----------|
     |<-- CALL_ANSWER --------------|                           |
     |                              |                           |
     |-- CALL_OFFER (WebRTC) ------>|-- CALL_OFFER ----------->|
     |                              |                           |
     |<-- CALL_ANSWER_SDP ----------|<-- CALL_ANSWER_SDP ------|
     |                              |                           |
     |<======== WebRTC P2P Connection =======================>|
     |                              |                           |
     |-- CALL_ICE_CANDIDATE ------->|-- CALL_ICE_CANDIDATE --->|
     |                              |                           |
     |                              |                           |
     |-- CALL_END ----------------->|-- CALL_END ------------>|
     |                              |                           |
```

## Backend Configuration

### 1. Socket Events Đã Được Thêm

Các socket events sau đã được thêm vào `src/shared/config/socket.ts`:

```typescript
// Call management events
CALL_INITIATE: 'call:initiate'; // Initiate a call
CALL_INCOMING: 'call:incoming'; // Incoming call notification
CALL_ANSWER: 'call:answer'; // Answer a call
CALL_REJECT: 'call:reject'; // Reject a call
CALL_END: 'call:end'; // End a call
CALL_CANCEL: 'call:cancel'; // Cancel a call (before answer)
CALL_RINGING: 'call:ringing'; // Call ringing status
CALL_STATUS: 'call:status'; // Call status update

// WebRTC signaling events
CALL_OFFER: 'call:offer'; // WebRTC offer
CALL_ANSWER_SDP: 'call:answer:sdp'; // WebRTC answer
CALL_ICE_CANDIDATE: 'call:ice:candidate'; // ICE candidate exchange
```

### 2. Types Đã Được Thêm

File `src/features/chat/types.ts` đã được cập nhật với:

```typescript
export type CallType = 'voice' | 'video';
export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'answered'
  | 'rejected'
  | 'ended'
  | 'cancelled'
  | 'busy'
  | 'missed';

export interface CallMetadata {
  callId: string;
  callType: CallType;
  status: CallStatus;
  duration?: number;
  startedAt?: string;
  endedAt?: string;
  initiatorId: string;
  receiverId: string;
  conversationId: string;
}
```

### 3. Call Handlers

Tất cả call handlers đã được thêm vào `src/sockets/modules/chat.ts`:

- **CALL_INITIATE**: Tạo call message, emit CALL_INCOMING cho receiver
- **CALL_ANSWER**: Cập nhật status thành "answered", emit cho initiator
- **CALL_REJECT**: Cập nhật status thành "rejected"
- **CALL_END**: Cập nhật status và duration
- **CALL_CANCEL**: Hủy call khi đang ring
- **CALL_OFFER/CALL_ANSWER_SDP/CALL_ICE_CANDIDATE**: WebRTC signaling

## Frontend Configuration

### 1. Cài Đặt Thư Viện

#### Cho React/Next.js Projects:

```bash
# Install WebRTC libraries
npm install simple-peer
# hoặc
npm install @tensorflow/tfjs  # nếu cần AI features
npm install react-speech-recognition  # optional: for voice commands
```

#### Cho React Native:

```bash
npm install react-native-webrtc
npm install react-native-permissions  # for microphone/camera permissions
```

### 2. Tạo Call Service

Tạo file `src/shared/services/call.service.ts`:

```typescript
import { socketClients, SOCKET_EVENTS } from '@/core/socket';
import Peer from 'simple-peer';

export interface CallServiceOptions {
  channel?: 'admin' | 'shop' | 'ai';
  onIncomingCall?: (callData: IncomingCallData) => void;
  onCallStatusChange?: (status: CallStatus) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export interface IncomingCallData {
  callId: string;
  conversationId: string;
  callType: 'voice' | 'video';
  initiator: {
    userId: string;
    name: string;
    avatar?: string;
  };
}

export type CallStatus = 'idle' | 'ringing' | 'answered' | 'rejected' | 'ended';

export class CallService {
  private socket: any = null;
  private peer: Peer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private currentCallType: 'voice' | 'video' | null = null;
  private options: CallServiceOptions = {};
  private channel: 'admin' | 'shop' | 'ai' = 'shop';

  constructor(options: CallServiceOptions = {}) {
    this.options = options;
    this.channel = options.channel || 'shop';
    this.connect();
  }

  private connect(): void {
    let socketClient;
    switch (this.channel) {
      case 'admin':
        socketClient = socketClients.adminChat;
        break;
      case 'shop':
        socketClient = socketClients.shopChat;
        break;
      case 'ai':
        socketClient = socketClients.aiChat;
        break;
      default:
        socketClient = socketClients.shopChat;
    }

    if (!socketClient) {
      this.options.onError?.(
        new Error(`Socket client not available for channel: ${this.channel}`)
      );
      return;
    }

    this.socket = socketClient.connect();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Handle incoming call
    this.socket.on(SOCKET_EVENTS.CALL_INCOMING, (payload: any) => {
      this.options.onIncomingCall?.({
        callId: payload.callId,
        conversationId: payload.conversationId,
        callType: payload.callType,
        initiator: payload.initiator,
      });
      this.options.onCallStatusChange?.('ringing');
    });

    // Handle call status updates
    this.socket.on(SOCKET_EVENTS.CALL_STATUS, (payload: any) => {
      if (payload.status === 'answered') {
        this.options.onCallStatusChange?.('answered');
      } else if (
        payload.status === 'rejected' ||
        payload.status === 'cancelled'
      ) {
        this.options.onCallStatusChange?.('ended');
        this.cleanup();
      } else if (payload.status === 'ended') {
        this.options.onCallStatusChange?.('ended');
        this.cleanup();
      }
    });

    // Handle WebRTC offer
    this.socket.on(SOCKET_EVENTS.CALL_OFFER, async (payload: any) => {
      if (this.currentCallId === payload.callId) {
        await this.handleOffer(payload.offer);
      }
    });

    // Handle WebRTC answer
    this.socket.on(SOCKET_EVENTS.CALL_ANSWER_SDP, async (payload: any) => {
      if (this.peer && this.currentCallId === payload.callId) {
        this.peer.signal(payload.answer);
      }
    });

    // Handle ICE candidates
    this.socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, (payload: any) => {
      if (
        this.peer &&
        this.currentCallId === payload.callId &&
        payload.candidate
      ) {
        this.peer.signal(payload.candidate);
      }
    });
  }

  /**
   * Initiate a call
   */
  async initiateCall(
    conversationId: string,
    callType: 'voice' | 'video'
  ): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    // Get user media
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      // Generate call ID
      const callId = `call_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      this.currentCallId = callId;
      this.currentCallType = callType;

      // Emit call initiate
      this.socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
        conversationId,
        callType,
      });

      // Wait for answer before creating peer connection
      // Peer will be created when receiver answers
    } catch (error: any) {
      this.options.onError?.(error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, conversationId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.currentCallId = callId;

    // Get user media
    try {
      // Get call type from incoming call data (should be stored)
      const callType = this.currentCallType || 'voice';
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      // Create peer connection (initiator: false)
      this.createPeerConnection(conversationId, false);

      // Emit answer
      this.socket.emit(SOCKET_EVENTS.CALL_ANSWER, {
        callId,
        conversationId,
      });

      this.options.onCallStatusChange?.('answered');
    } catch (error: any) {
      this.options.onError?.(error);
      throw error;
    }
  }

  /**
   * Reject a call
   */
  rejectCall(callId: string, conversationId: string, reason?: string): void {
    if (!this.socket) return;

    this.socket.emit(SOCKET_EVENTS.CALL_REJECT, {
      callId,
      conversationId,
      reason,
    });

    this.cleanup();
  }

  /**
   * End a call
   */
  endCall(callId: string, conversationId: string, duration?: number): void {
    if (!this.socket) return;

    this.socket.emit(SOCKET_EVENTS.CALL_END, {
      callId,
      conversationId,
      duration,
    });

    this.cleanup();
  }

  /**
   * Cancel a call (before answer)
   */
  cancelCall(callId: string, conversationId: string): void {
    if (!this.socket) return;

    this.socket.emit(SOCKET_EVENTS.CALL_CANCEL, {
      callId,
      conversationId,
    });

    this.cleanup();
  }

  /**
   * Create peer connection
   */
  private createPeerConnection(
    conversationId: string,
    initiator: boolean
  ): void {
    if (!this.localStream) return;

    const peer = new Peer({
      initiator,
      trickle: false,
      stream: this.localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (data) => {
      if (!this.socket || !this.currentCallId) return;

      if (data.type === 'offer') {
        this.socket.emit(SOCKET_EVENTS.CALL_OFFER, {
          callId: this.currentCallId,
          conversationId,
          offer: data,
        });
      } else if (data.type === 'answer') {
        this.socket.emit(SOCKET_EVENTS.CALL_ANSWER_SDP, {
          callId: this.currentCallId,
          conversationId,
          answer: data,
        });
      }
    });

    peer.on('stream', (stream) => {
      this.remoteStream = stream;
      this.options.onRemoteStream?.(stream);
    });

    peer.on('error', (error) => {
      this.options.onError?.(error);
    });

    peer.on('close', () => {
      this.cleanup();
    });

    this.peer = peer;
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.localStream) return;

    // Create peer connection as receiver
    this.createPeerConnection('', false);

    if (this.peer) {
      this.peer.signal(offer);
    }
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
    this.currentCallType = null;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.off(SOCKET_EVENTS.CALL_INCOMING);
      this.socket.off(SOCKET_EVENTS.CALL_STATUS);
      this.socket.off(SOCKET_EVENTS.CALL_OFFER);
      this.socket.off(SOCKET_EVENTS.CALL_ANSWER_SDP);
      this.socket.off(SOCKET_EVENTS.CALL_ICE_CANDIDATE);
    }
  }
}

export const createCallService = (
  options: CallServiceOptions = {}
): CallService => {
  return new CallService(options);
};
```

### 3. Tạo Call Component

Tạo file `src/features/Chat/components/CallComponent.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import {
  CallService,
  IncomingCallData,
  CallStatus,
} from '@/shared/services/call.service';

interface CallComponentProps {
  conversationId: string;
  channel?: 'admin' | 'shop' | 'ai';
  onCallEnd?: () => void;
}

export const CallComponent: React.FC<CallComponentProps> = ({
  conversationId,
  channel = 'shop',
  onCallEnd,
}) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callServiceRef = useRef<CallService | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize call service
    callServiceRef.current = new CallService({
      channel,
      onIncomingCall: (callData) => {
        setIncomingCall(callData);
        setCallType(callData.callType);
        setCallStatus('ringing');
      },
      onCallStatusChange: (status) => {
        setCallStatus(status);
        if (status === 'answered') {
          callStartTimeRef.current = Date.now();
        } else if (status === 'ended') {
          onCallEnd?.();
        }
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      onError: (error) => {
        console.error('Call error:', error);
        setCallStatus('ended');
      },
    });

    // Setup local video
    const setupLocalVideo = async () => {
      if (callServiceRef.current && localVideoRef.current) {
        const stream = callServiceRef.current.getLocalStream();
        if (stream) {
          localVideoRef.current.srcObject = stream;
        }
      }
    };

    if (callStatus === 'answered') {
      setupLocalVideo();
    }

    return () => {
      callServiceRef.current?.disconnect();
    };
  }, [channel, onCallEnd]);

  // Update local video when stream changes
  useEffect(() => {
    if (
      callServiceRef.current &&
      localVideoRef.current &&
      callStatus === 'answered'
    ) {
      const stream = callServiceRef.current.getLocalStream();
      if (stream) {
        localVideoRef.current.srcObject = stream;
      }
    }
  }, [callStatus]);

  const handleInitiateCall = async (type: 'voice' | 'video') => {
    try {
      setCallType(type);
      await callServiceRef.current?.initiateCall(conversationId, type);
      setCallStatus('ringing');
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const handleAnswerCall = async () => {
    if (incomingCall) {
      await callServiceRef.current?.answerCall(
        incomingCall.callId,
        incomingCall.conversationId
      );
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      callServiceRef.current?.rejectCall(
        incomingCall.callId,
        incomingCall.conversationId
      );
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  const handleEndCall = () => {
    const duration = callStartTimeRef.current
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : undefined;

    // Find current call ID (should be stored in state)
    const callId = incomingCall?.callId || 'current-call-id';
    callServiceRef.current?.endCall(callId, conversationId, duration);
    setCallStatus('idle');
    setIncomingCall(null);
    onCallEnd?.();
  };

  return (
    <div className="call-container">
      {/* Incoming Call Modal */}
      {incomingCall && callStatus === 'ringing' && (
        <div className="incoming-call-modal">
          <div className="call-info">
            <img
              src={incomingCall.initiator.avatar}
              alt={incomingCall.initiator.name}
            />
            <h3>{incomingCall.initiator.name}</h3>
            <p>{callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
          </div>
          <div className="call-actions">
            <button onClick={handleRejectCall} className="btn-reject">
              Reject
            </button>
            <button onClick={handleAnswerCall} className="btn-answer">
              Answer
            </button>
          </div>
        </div>
      )}

      {/* Active Call UI */}
      {callStatus === 'answered' && (
        <div className="active-call">
          {/* Remote video (only for video calls) */}
          {callType === 'video' && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
          )}

          {/* Local video (only for video calls) */}
          {callType === 'video' && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
          )}

          {/* Call controls */}
          <div className="call-controls">
            <button onClick={handleEndCall} className="btn-end-call">
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Call buttons (when idle) */}
      {callStatus === 'idle' && (
        <div className="call-buttons">
          <button
            onClick={() => handleInitiateCall('voice')}
            className="btn-call-voice"
          >
            Voice Call
          </button>
          <button
            onClick={() => handleInitiateCall('video')}
            className="btn-call-video"
          >
            Video Call
          </button>
        </div>
      )}
    </div>
  );
};
```

### 4. Tích Hợp Vào Chat Window

Cập nhật `ChatWindow.tsx` để thêm call buttons:

```typescript
import { CallComponent } from './CallComponent';
import { useState } from 'react';

// Trong component ChatWindow:
const [showCall, setShowCall] = useState(false);

// Thêm vào UI:
<button onClick={() => setShowCall(true)}>📞 Call</button>;

{
  showCall && (
    <CallComponent
      conversationId={conversationId}
      channel={channel}
      onCallEnd={() => setShowCall(false)}
    />
  );
}
```

## STUN/TURN Servers

Để call hoạt động tốt hơn, bạn có thể cấu hình STUN/TURN servers:

### Miễn phí:

```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
```

### Trả phí (cho production):

- Twilio: https://www.twilio.com/stun-turn
- Metered: https://www.metered.ca/stun-turn
- Xirsys: https://xirsys.com/

## Testing

1. **Test local**: Mở 2 browser windows, login với 2 users khác nhau
2. **Test call flow**:
   - User A initiate call
   - User B nhận incoming call
   - User B answer
   - Verify WebRTC connection
   - End call

## Troubleshooting

1. **Microphone/Camera permissions**: Đảm bảo browser đã grant permissions
2. **Firewall**: WebRTC cần UDP ports mở
3. **HTTPS**: WebRTC yêu cầu HTTPS trong production (hoặc localhost)
4. **STUN/TURN**: Cần STUN/TURN servers nếu users ở sau NAT/firewall

## Next Steps

1. ✅ Backend socket events đã được cấu hình
2. ✅ Types đã được thêm
3. ✅ Call handlers đã được implement
4. ⬜ Frontend: Cài đặt thư viện WebRTC
5. ⬜ Frontend: Implement CallService
6. ⬜ Frontend: Tạo CallComponent UI
7. ⬜ Testing và debugging
