"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleEnabled = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_1 = __importDefault(require("passport"));
const callbackURL = `${process.env.PORT_URL || "http://localhost:5000"}/auth/social/google/callback`;
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
exports.googleEnabled = Boolean(googleClientID && googleClientSecret);
if (exports.googleEnabled) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL,
        scope: ["email", "profile"],
    }, (accessToken, refreshToken, profile, done) => {
        const { name, emails, photos } = profile;
        const user = {
            email: emails?.[0]?.value,
            firstName: name?.givenName,
            lastName: name?.familyName,
            picture: photos?.[0]?.value,
            accessToken,
        };
        return done(null, user);
    }));
}
else {
    // eslint-disable-next-line no-console
    console.warn("[SOCIAL] Google OAuth not configured (missing GOOGLE_CLIENT_ID/SECRET)");
}
exports.default = passport_1.default;
