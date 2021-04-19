import { verify } from "jsonwebtoken";
import { InvalidAccessCredentialsException } from "../exceptions";
import { UserInterface } from "../models/user";
import User, { signTokenKey, TokenPayloadInterface } from "../modules/user";



export const decodeToken = async function (token:string): Promise<UserInterface> {
    try {
      //@ts-ignore
      const decoded: TokenPayloadInterface = verify(token, signTokenKey);
      //@ts-ignore
      const user: UserInterface = await User.fetchUser(decoded);
      return Promise.resolve(user);
    } catch (e) {
      if(e.name == "TokenExpiredError") {
        throw new InvalidAccessCredentialsException('This token has expired')
      }
      if(e.name == "JsonWebTokenError"){
        throw new InvalidAccessCredentialsException('Invalid token')
      }
      throw e;
    }
}
