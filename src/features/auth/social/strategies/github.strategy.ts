import passport from "passport";
import { Strategy, Profile } from "passport-github2";

const callbackURL = `${
  process.env.PORT_URL || "http://localhost:5000"
}/auth/social/github/callback`;

const ghClientID = process.env.GITHUB_CLIENT_ID as string | undefined;
const ghClientSecret = process.env.GITHUB_CLIENT_SECRET as string | undefined;
export const githubEnabled = Boolean(ghClientID && ghClientSecret);

if (githubEnabled) {
  passport.use(
    new Strategy(
      {
        clientID: ghClientID as string,
        clientSecret: ghClientSecret as string,
        callbackURL,
        scope: ["user:email"],
      },
      (
        accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: any, user?: any) => void
      ) => {
        const emails = (profile as any).emails || [];
        const photos = (profile as any).photos || [];
        const displayName = (profile as any).displayName || "";
        const [firstName, ...last] = displayName.split(" ");
        const user = {
          email: emails?.[0]?.value,
          firstName,
          lastName: last.join(" "),
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
    "[SOCIAL] GitHub OAuth not configured (missing GITHUB_CLIENT_ID/SECRET)"
  );
}

export default passport;
