"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserModel_1 = __importDefault(require("../../../models/UserModel"));
class SocialService {
    static async findOrCreateGoogleUser(googleUser) {
        let user = await UserModel_1.default.findOne({ email: googleUser.email });
        if (!user) {
            user = await UserModel_1.default.create({
                email: googleUser.email,
                name: googleUser.firstName || googleUser.email.split("@")[0],
                avatar: googleUser.picture,
                password: "", // not used for social login
                verifyToken: undefined,
                status: "active",
            });
        }
        return user;
    }
    static async findOrCreateFacebookUser(facebookUser) {
        let user = await UserModel_1.default.findOne({ email: facebookUser.email });
        if (!user) {
            user = await UserModel_1.default.create({
                email: facebookUser.email,
                name: facebookUser.firstName || facebookUser.email.split("@")[0],
                avatar: facebookUser.picture,
                password: "",
                verifyToken: undefined,
                status: "active",
            });
        }
        return user;
    }
    static async findOrCreateGithubUser(githubUser) {
        let user = await UserModel_1.default.findOne({ email: githubUser.email });
        if (!user) {
            user = await UserModel_1.default.create({
                email: githubUser.email,
                name: githubUser.firstName || githubUser.email.split("@")[0],
                avatar: githubUser.picture,
                password: "",
                verifyToken: undefined,
                status: "active",
            });
        }
        return user;
    }
}
exports.default = SocialService;
