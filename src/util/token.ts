import * as crypto from 'crypto';


export const generateToken = (num:number) =>
	new Promise((resolve, reject) => {
		crypto.randomBytes(num || 16, (err, buffer) => {
			if (err) reject(err);
			const token = buffer.toString('hex');
			resolve(token);
		});
	});

//@ts-ignore
  export let generateNumber = (n:number)=> {
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if ( n > max ) {
            return generateNumber(max) + generateNumber(n - max);
    }

    max        = Math.pow(10, n+add);
    var min    = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;

    return ("" + number).substring(add);
}

export const padLeft = (nr:number, n:number, str:string)=>{
  return Array(n-String(nr).length+1).join(str||'0')+nr;
}
