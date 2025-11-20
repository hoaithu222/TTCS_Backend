import { Socket } from "socket.io";

export interface SocketAuthedUser {
  userId: string;
  role?: string;
  email?: string;
  name?: string;
  fullName?: string;
  avatar?: string;
}

export type SocketAuthNext = (err?: Error) => void;

export type SocketAuthMiddleware = (
  socket: Socket,
  next: SocketAuthNext
) => Promise<void> | void;

export const attachSocketUser = (
  socket: Socket,
  user: SocketAuthedUser
): void => {
  socket.data.user = user;
};

export const getSocketUser = (
  socket: Socket
): SocketAuthedUser | undefined => {
  return socket.data.user as SocketAuthedUser | undefined;
};


