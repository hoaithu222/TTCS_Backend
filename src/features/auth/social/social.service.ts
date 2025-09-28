import UserModel from "../../../models/UserModel";

export interface SocialUserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken?: string;
}

export default class SocialService {
  static async findOrCreateGoogleUser(googleUser: SocialUserProfile) {
    let user = await UserModel.findOne({ email: googleUser.email });
    if (!user) {
      user = await UserModel.create({
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

  static async findOrCreateFacebookUser(facebookUser: SocialUserProfile) {
    let user = await UserModel.findOne({ email: facebookUser.email });
    if (!user) {
      user = await UserModel.create({
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

  static async findOrCreateGithubUser(githubUser: SocialUserProfile) {
    let user = await UserModel.findOne({ email: githubUser.email });
    if (!user) {
      user = await UserModel.create({
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
