import { Server } from "socket.io";

let ioInstance: Server | null = null;

export const registerSocketServer = (io: Server) => {
  ioInstance = io;
};

export const getSocketServer = (): Server | null => {
  return ioInstance;
};


