"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketUser = exports.attachSocketUser = void 0;
const attachSocketUser = (socket, user) => {
    socket.data.user = user;
};
exports.attachSocketUser = attachSocketUser;
const getSocketUser = (socket) => {
    return socket.data.user;
};
exports.getSocketUser = getSocketUser;
