
/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import {RequestHandler, Request, Response, NextFunction} from 'express';

import {mkdirSync, existsSync, unlinkSync} from 'fs-extra';
import {
  BadInputFormatException,
  InvalidAccessCredentialsException
} from '../exceptions/index';
import Uploader from '../util/uploader';
import Ctrl from './ctrl';

/**
 * Middleware to handles token authentication
 * @category Controllers
 */
class UploaderClass extends Ctrl {
  fileUpload(): RequestHandler {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // @ts-ignore
        let files = req.files;
        if (!files) {
          throw new BadInputFormatException('Add a file to upload');
        }
        // @ts-ignore
        files = files.file;
        if (!files) {
          throw new BadInputFormatException(
            'The image must be provided with the key: `file`'
          );
        }
        const path = './temp';
        if (!existsSync(path)) {
          mkdirSync(path);
        }
        if (Array.isArray(files)) {
          const images = [];
          for (const file of files) {
            // @ts-ignore
            await file.mv(path + '/' + file.name);
            const uploader = new Uploader();
            // @ts-ignore
            const url = await uploader.upload(path + '/' + file.name, `files/`, {});
            images.push(url);
            // @ts-ignore
            unlinkSync(path + '/' + file.name);
          }
          res.send({images, message: 'files uploaded'});
        } else {
          // @ts-ignore
          await files.mv(path + '/' + files.name);
          const uploader = new Uploader();
          const url = await uploader.upload(path + '/' + files.name, `files/`, {});
          unlinkSync(path + '/' + files.name);
          res.send({image: url, message: 'file uploaded'});
        }
      } catch (error) {
        this.handleError(error, req, res);
      }
    };
  }
}

export default UploaderClass;
