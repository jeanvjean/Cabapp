/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import {RequestHandler, Request, Response, NextFunction} from 'express';
import {verify} from 'jsonwebtoken';
import Ctrl from '../controllers/ctrl';
import {BadInputFormatException, InvalidAccessCredentialsException} from '../exceptions';
import {UserInterface} from '../models/user';
import {signTokenKey, TokenPayloadInterface} from '../modules/user';
import {user as User} from '../modules/index';

class Authenticate extends Ctrl {
  public verify(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void>=>{
      try {
        let token = req.get('Authorization');
        if (!token) {
          throw new InvalidAccessCredentialsException('Invalid token');
        }
        token = token.split(' ')[0];
        // @ts-ignore
        const decoded: TokenPayloadInterface= verify(token, signTokenKey);
        const userAccount: UserInterface = await User.fetchUserAuth(decoded);
        // @ts-ignore
        req.user = userAccount;
        return next();
      } catch (error) {
        if (error.name == 'TokenExpiredError') {
          throw new InvalidAccessCredentialsException('This token has expired');
        }
        if (error.name == 'JsonWebTokenError') {
          throw new InvalidAccessCredentialsException('Invalid token');
        }
        this.handleError(error, req, res);
      }
    };
  }
}

export default Authenticate;
