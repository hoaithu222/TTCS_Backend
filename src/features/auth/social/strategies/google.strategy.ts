import { Strategy, VerifyCallback } from "passport-google-oauth20";
import passport from "passport";

const callbackURL = `${
  process.env.PORT_URL || "http://localhost:5000"
}/auth/social/google/callback`;

const googleClientID = process.env.GOOGLE_CLIENT_ID as string | undefined;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as
  | string
  | undefined;

export const googleEnabled = Boolean(googleClientID && googleClientSecret);

if (googleEnabled) {
  passport.use(
    new Strategy(
      {
        clientID: googleClientID as string,
        clientSecret: googleClientSecret as string,
        callbackURL,
        scope: ["email", "profile"],
      },
      (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback
      ) => {
        const { name, emails, photos } = profile;
        const user = {
          email: emails?.[0]?.value,
          firstName: name?.givenName,
          lastName: name?.familyName,
          picture: photos?.[0]?.value,
          accessToken,
        };
        return done(null, user);
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[SOCIAL] Google OAuth not configured (missing GOOGLE_CLIENT_ID/SECRET)"
  );
}

export default passport;
