/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-tabs */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
const cloud = require('cloudinary');
const cloudinary = cloud.v2;
import SecretKeys from '../configs/static';
class Uploader {
	// @ts-ignore
	private cloudinary
	constructor() {}

	public async upload(stream: string, path: string, override = {}) {
	  try {
	    cloudinary.config({
	      cloud_name: SecretKeys.CLOUDINARY_NAME,
	      api_key: SecretKeys.CLOUDINARY_KEY,
	      api_secret: SecretKeys.CLOUDINARY_SECRET
	    });
	    const result = await cloudinary.uploader.upload(
	      stream,
	      {
	        folder: path,
	        resource_type: 'auto',
	        ...override
	      },
	      () => {}
	    );
	    return result.secure_url;
	  } catch (err) {
	    console.log(err);
	    throw new Error(err);
	  }
	}

	public async destroy(file: string) {
	  try {
	    cloudinary.config({
	      cloud_name: SecretKeys.CLOUDINARY_NAME,
	      api_key: SecretKeys.CLOUDINARY_KEY,
	      api_secret: SecretKeys.CLOUDINARY_SECRET
	    });
	    return await cloudinary.uploader.destroy(file);
	  } catch (err) {
	    throw new Error(err);
	  }
	}
}

export default Uploader;
