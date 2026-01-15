import { Router, Request, Response } from "express";
import passport from "passport";
import { googleEnabled } from "./strategies/google.strategy";
import { facebookEnabled } from "./strategies/facebook.strategy";
import { githubEnabled } from "./strategies/github.strategy";
import UserModel, { OtpMethod } from "../../../models/UserModel";
import Jwt from "../../../shared/utils/jwt";

const router = Router();

if (googleEnabled) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["email", "profile"],
      session: false,
    })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth/social/google",
      session: false,
    }),
    async (req: Request, res: Response) => {
      try {
        const socialUser = (req as any).user as any;
        if (!socialUser?.email) {
          const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
          return res.redirect(`${frontendURL}/auth/callback?error=no_email`);
        }

        let user = await UserModel.findOne({ email: socialUser.email });
        if (!user) {
          user = await UserModel.create({
            email: socialUser.email,
            name: socialUser.firstName || socialUser.email.split("@")[0],
            avatar: socialUser.picture,
            password: Jwt.generateRefreshToken(),
            verifyToken: undefined,
            status: "active",
            otpMethod: OtpMethod.EMAIL,
          });
        }

        const accessToken = Jwt.generateAccessToken({
          userId: user.id.toString(),
          email: user.email,
        });
        user.accessToken = accessToken;
        await user.save();

        // Redirect to frontend with token
        const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${frontendURL}/auth/callback?token=${accessToken}`);
      } catch (error) {
        console.error("[Social Login] Google callback error:", error);
        const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${frontendURL}/auth/callback?error=server_error`);
      }
    }
  );
}

if (facebookEnabled) {
  router.get(
    "/facebook",
    passport.authenticate("facebook", { scope: ["email"], session: false })
  );

  router.get(
    "/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: "/auth/social/facebook",
      session: false,
    }),
    async (req: Request, res: Response) => {
      try {
        const socialUser = (req as any).user as any;
        if (!socialUser?.email) {
          const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
          return res.redirect(`${frontendURL}/auth/callback?error=no_email`);
        }

        let user = await UserModel.findOne({ email: socialUser.email });
        if (!user) {
          user = await UserModel.create({
            email: socialUser.email,
            name: socialUser.firstName || socialUser.email.split("@")[0],
            avatar: socialUser.picture,
            password: Jwt.generateRefreshToken(),
            verifyToken: undefined,
            status: "active",
            otpMethod: OtpMethod.EMAIL,
          });
        }

        const accessToken = Jwt.generateAccessToken({
          userId: user.id.toString(),
          email: user.email,
        });
        user.accessToken = accessToken;
        await user.save();

        // Redirect to frontend with token
        const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${frontendURL}/auth/callback?token=${accessToken}`);
      } catch (error) {
        console.error("[Social Login] Facebook callback error:", error);
        const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${frontendURL}/auth/callback?error=server_error`);
      }
    }
  );
}

if (githubEnabled) {
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false })
  );

  router.get(
    "/github/callback",
    passport.authenticate("github", {
      failureRedirect: "/auth/social/github",
      session: false,
    }),
    async (req: Request, res: Response) => {
      try {
        const socialUser = (req as any).user as any;
        if (!socialUser?.email) {
          const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
          return res.redirect(`${frontendURL}/auth/callback?error=no_email`);
        }

        let user = await UserModel.findOne({ email: socialUser.email });
        if (!user) {
          user = await UserModel.create({
            email: socialUser.email,
            name: socialUser.firstName || socialUser.email.split("@")[0],
            avatar: socialUser.picture,
            password: Jwt.generateRefreshToken(),
            verifyToken: undefined,
            status: "active",
            otpMethod: OtpMethod.EMAIL,
          });
        }

        const accessToken = Jwt.generateAccessToken({
          userId: user.id.toString(),
          email: user.email,
        });
        user.accessToken = accessToken;
        await user.save();

        // Redirect to frontend with token
        const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${frontendURL}/auth/callback?token=${accessToken}`);
      } catch (error) {
        console.error("[Social Login] GitHub callback error:", error);
        const frontendURL = process.env.USER_CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${frontendURL}/auth/callback?error=server_error`);
      }
    }
  );
}

export default router;
