const cloud = require('cloudinary')
const cloudinary = cloud.v2
import SecretKeys from '../configs/static';
class Uploader {
	// @ts-ignore
	private cloudinary
	constructor() {}

	public async upload(stream: string, path: string, override = {}) {
		try {
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_NAME,
				api_key: process.env.CLOUDINARY_KEY,
				api_secret: process.env.CLOUDINARY_SECRET
			});
			let result = await cloudinary.uploader.upload(
				stream,
				{
          folder: path,
          resource_type: "auto",
					...override
				},
				() => {}
			)
			return result.secure_url
		} catch (err) {
			console.log(err)
			throw new Error(err)
		}
	}

	public async destroy(file: string) {
		try {
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_NAME,
				api_key: process.env.CLOUDINARY_KEY,
				api_secret: process.env.CLOUDINARY_SECRET
			})
			return await cloudinary.uploader.destroy(file)
		} catch (err) {
			throw new Error(err)
		}
	}
}

export default Uploader
