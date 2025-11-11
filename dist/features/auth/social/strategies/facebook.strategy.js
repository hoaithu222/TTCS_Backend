"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookEnabled = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_facebook_1 = require("passport-facebook");
const callbackURL = `${process.env.PORT_URL || "http://localhost:5000"}/auth/social/facebook/callback`;
const fbClientID = process.env.FACEBOOK_CLIENT_ID;
const fbClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
exports.facebookEnabled = Boolean(fbClientID && fbClientSecret);
if (exports.facebookEnabled) {
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: fbClientID,
        clientSecret: fbClientSecret,
        callbackURL,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
    }, (accessToken, _refreshToken, profile, done) => {
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
    console.warn("[SOCIAL] Facebook OAuth not configured (missing FACEBOOK_CLIENT_ID/SECRET)");
}
exports.default = passport_1.default;
