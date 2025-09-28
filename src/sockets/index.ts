import { Server } from 'socket.io';

const socketHandler = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user join room
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Handle user leave room
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room: ${roomId}`);
    });

    // Handle chat message
    socket.on('send-message', (data) => {
      const { roomId, message, userId, username } = data;
      io.to(roomId).emit('receive-message', {
        message,
        userId,
        username,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { roomId, userId, username } = data;
      socket.to(roomId).emit('user-typing', { userId, username });
    });

    // Handle stop typing
    socket.on('stop-typing', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-stop-typing', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default socketHandler; 