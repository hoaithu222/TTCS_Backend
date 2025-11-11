"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubEnabled = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const callbackURL = `${process.env.PORT_URL || "http://localhost:5000"}/auth/social/github/callback`;
const ghClientID = process.env.GITHUB_CLIENT_ID;
const ghClientSecret = process.env.GITHUB_CLIENT_SECRET;
exports.githubEnabled = Boolean(ghClientID && ghClientSecret);
if (exports.githubEnabled) {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: ghClientID,
        clientSecret: ghClientSecret,
        callbackURL,
        scope: ["user:email"],
    }, (accessToken, _refreshToken, profile, done) => {
        const emails = profile.emails || [];
        const photos = profile.photos || [];
        const displayName = profile.displayName || "";
        const [firstName, ...last] = displayName.split(" ");
        const user = {
            email: emails?.[0]?.value,
            firstName,
            lastName: last.join(" "),
            picture: photos?.[0]?.value,
            accessToken,
        };
        return done(null, user);
    }));
}
else {
    // eslint-disable-next-line no-console
    console.warn("[SOCIAL] GitHub OAuth not configured (missing GITHUB_CLIENT_ID/SECRET)");
}
exports.default = passport_1.default;
