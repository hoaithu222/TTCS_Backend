import passport from "passport";
import { Strategy, Profile } from "passport-facebook";

const callbackURL = `${
  process.env.PORT_URL || "http://localhost:5000"
}/auth/social/facebook/callback`;

const fbClientID = process.env.FACEBOOK_CLIENT_ID as string | undefined;
const fbClientSecret = process.env.FACEBOOK_CLIENT_SECRET as string | undefined;
export const facebookEnabled = Boolean(fbClientID && fbClientSecret);

if (facebookEnabled) {
  passport.use(
    new Strategy(
      {
        clientID: fbClientID as string,
        clientSecret: fbClientSecret as string,
        callbackURL,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
      },
      (
        accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: any, user?: any) => void
      ) => {
        const { name, emails, photos } = profile as any;
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
    "[SOCIAL] Facebook OAuth not configured (missing FACEBOOK_CLIENT_ID/SECRET)"
  );
}

export default passport;
