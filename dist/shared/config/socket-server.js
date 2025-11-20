"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketServer = exports.registerSocketServer = void 0;
let ioInstance = null;
const registerSocketServer = (io) => {
    ioInstance = io;
};
exports.registerSocketServer = registerSocketServer;
const getSocketServer = () => {
    return ioInstance;
};
exports.getSocketServer = getSocketServer;
