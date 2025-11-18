"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = __importDefault(require("../shared/utils/jwt"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const socketHandler = (io) => {
    io.use(async (socket, next) => {
        try {
            const auth = socket.handshake.auth;
            const authHeader = socket.handshake.headers.authorization;
            const token = auth?.token ||
                (authHeader && authHeader.startsWith("Bearer ")
                    ? authHeader.split(" ")[1]
                    : authHeader);
            if (token) {
                try {
                    const decoded = jwt_1.default.verifyAccessToken(token);
                    const user = await UserModel_1.default.findById(decoded.userId).select("_id email name fullName avatar role");
                    if (user) {
                        socket.user = {
                            userId: user._id.toString(),
                            user,
                        };
                    }
                }
                catch (error) {
                    console.error("Socket auth token invalid:", error);
                }
            }
            else if (auth?.userId) {
                socket.user = { userId: auth.userId };
            }
            next();
        }
        catch (error) {
            console.error("Socket auth error:", error);
            next();
        }
    });
    io.on("connection", (socket) => {
        const socketUser = socket.user;
        const userId = socketUser?.userId || socket.handshake.auth?.userId;
        console.log(`Socket connected: ${socket.id}${userId ? ` (userId: ${userId})` : ""}`);
        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${socket.id} (${reason})`);
        });
    });
};
exports.default = socketHandler;
