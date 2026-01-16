"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const google_strategy_1 = require("./strategies/google.strategy");
const facebook_strategy_1 = require("./strategies/facebook.strategy");
const github_strategy_1 = require("./strategies/github.strategy");
const UserModel_1 = __importStar(require("../../../models/UserModel"));
const jwt_1 = __importDefault(require("../../../shared/utils/jwt"));
const router = (0, express_1.Router)();
if (google_strategy_1.googleEnabled) {
    router.get("/google", passport_1.default.authenticate("google", {
        scope: ["email", "profile"],
        session: false,
    }));
    router.get("/google/callback", passport_1.default.authenticate("google", {
        failureRedirect: "/auth/social/google",
        session: false,
    }), async (req, res) => {
        try {
            console.log("[Social Login] Google callback triggered");
            const socialUser = req.user;
            console.log("[Social Login] Social user data:", socialUser);
            if (!socialUser?.email) {
                console.error("[Social Login] No email from Google");
                const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
                return res.redirect(`${frontendURL}/auth/callback?error=no_email`);
            }
            console.log("[Social Login] Looking for user with email:", socialUser.email);
            let user = await UserModel_1.default.findOne({ email: socialUser.email });
            if (!user) {
                console.log("[Social Login] User not found, creating new user");
                user = await UserModel_1.default.create({
                    email: socialUser.email,
                    name: socialUser.firstName || socialUser.email.split("@")[0],
                    avatar: socialUser.picture,
                    password: jwt_1.default.generateRefreshToken(),
                    verifyToken: undefined,
                    status: "active",
                    otpMethod: UserModel_1.OtpMethod.EMAIL,
                });
                console.log("[Social Login] New user created:", user._id);
            }
            else {
                console.log("[Social Login] Existing user found:", user._id);
            }
            console.log("[Social Login] Generating access token");
            const accessToken = jwt_1.default.generateAccessToken({
                userId: user.id.toString(),
                email: user.email,
            });
            user.accessToken = accessToken;
            await user.save();
            console.log("[Social Login] User saved with token");
            // Redirect to frontend with token
            const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
            console.log("[Social Login] Redirecting to:", `${frontendURL}/auth/callback`);
            return res.redirect(`${frontendURL}/auth/callback?token=${accessToken}`);
        }
        catch (error) {
            console.error("[Social Login] Google callback error:", error);
            console.error("[Social Login] Error stack:", error.stack);
            console.error("[Social Login] Error message:", error.message);
            const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
            return res.redirect(`${frontendURL}/auth/callback?error=server_error`);
        }
    });
}
if (facebook_strategy_1.facebookEnabled) {
    router.get("/facebook", passport_1.default.authenticate("facebook", { scope: ["email"], session: false }));
    router.get("/facebook/callback", passport_1.default.authenticate("facebook", {
        failureRedirect: "/auth/social/facebook",
        session: false,
    }), async (req, res) => {
        try {
            const socialUser = req.user;
            if (!socialUser?.email) {
                const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
                return res.redirect(`${frontendURL}/auth/callback?error=no_email`);
            }
            let user = await UserModel_1.default.findOne({ email: socialUser.email });
            if (!user) {
                user = await UserModel_1.default.create({
                    email: socialUser.email,
                    name: socialUser.firstName || socialUser.email.split("@")[0],
                    avatar: socialUser.picture,
                    password: jwt_1.default.generateRefreshToken(),
                    verifyToken: undefined,
                    status: "active",
                    otpMethod: UserModel_1.OtpMethod.EMAIL,
                });
            }
            const accessToken = jwt_1.default.generateAccessToken({
                userId: user.id.toString(),
                email: user.email,
            });
            user.accessToken = accessToken;
            await user.save();
            // Redirect to frontend with token
            const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
            return res.redirect(`${frontendURL}/auth/callback?token=${accessToken}`);
        }
        catch (error) {
            console.error("[Social Login] Facebook callback error:", error);
            const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
            return res.redirect(`${frontendURL}/auth/callback?error=server_error`);
        }
    });
}
if (github_strategy_1.githubEnabled) {
    router.get("/github", passport_1.default.authenticate("github", { scope: ["user:email"], session: false }));
    router.get("/github/callback", passport_1.default.authenticate("github", {
        failureRedirect: "/auth/social/github",
        session: false,
    }), async (req, res) => {
        try {
            const socialUser = req.user;
            if (!socialUser?.email) {
                const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
                return res.redirect(`${frontendURL}/auth/callback?error=no_email`);
            }
            let user = await UserModel_1.default.findOne({ email: socialUser.email });
            if (!user) {
                user = await UserModel_1.default.create({
                    email: socialUser.email,
                    name: socialUser.firstName || socialUser.email.split("@")[0],
                    avatar: socialUser.picture,
                    password: jwt_1.default.generateRefreshToken(),
                    verifyToken: undefined,
                    status: "active",
                    otpMethod: UserModel_1.OtpMethod.EMAIL,
                });
            }
            const accessToken = jwt_1.default.generateAccessToken({
                userId: user.id.toString(),
                email: user.email,
            });
            user.accessToken = accessToken;
            await user.save();
            // Redirect to frontend with token
            const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
            return res.redirect(`${frontendURL}/auth/callback?token=${accessToken}`);
        }
        catch (error) {
            console.error("[Social Login] GitHub callback error:", error);
            const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
            return res.redirect(`${frontendURL}/auth/callback?error=server_error`);
        }
    });
}
exports.default = router;
