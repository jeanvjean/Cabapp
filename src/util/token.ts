import * as crypto from 'crypto';


export const generateToken = (num:number) =>
	new Promise((resolve, reject) => {
		crypto.randomBytes(num || 16, (err, buffer) => {
			if (err) reject(err);
			const token = buffer.toString('hex');
			resolve(token);
		});
	});
