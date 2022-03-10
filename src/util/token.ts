/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
import * as crypto from 'crypto';
import {BadInputFormatException} from '../exceptions';
import {User} from '../models';
import {UserInterface} from '../models/user';
import {Parser} from 'json2csv';
import {uuid} from 'uuid-apikey';


export const generateToken = (num: number) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(num || 16, (err, buffer) => {
      if (err) reject(err);
      const token = buffer.toString('hex');
      resolve(token);
    });
  });

// @ts-ignore
export const generateNumber = (n: number)=> {
  const add = 1; let max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

  if ( n > max ) {
    return generateNumber(max) + generateNumber(n - max);
  }

  max = Math.pow(10, n+add);
  const min = max/10; // Math.pow(10, n) basically
  const number = Math.floor( Math.random() * (max - min + 1) ) + min;

  return ('' + number).substring(add);
};

export const padLeft = (nr: number, n: number, str: string)=>{
  return Array(n-String(nr).length+1).join(str||'0')+nr;
};
// const zeroPad = (num, places) => String(num).padStart(places, '0')

// for (let i = 1; i <= n; i++) {
//   console.log("#".repeat(i).padStart(n));
// }

export const passWdCheck = async (user: UserInterface, pwd: string)=>{
  const loginUser = await User.findById(user._id).select('+password');
  const matchPWD = await loginUser?.comparePWD(pwd, user.password);
  if (!matchPWD) {
    throw new BadInputFormatException('Incorrect password... please check the password');
  }
  return true;
};
// @ts-ignore
export const toCSV = ({fields, data})=> {
  const parser = new Parser({fields});
  return parser.parse(data);
};

const toTwoValue = (value: any)=> {
  if (String(value).length === 1) {
    return `0${value}`;
  }
  return value;
};

export const formatDate = (dateValue: any)=> {
  const date = new Date(dateValue);
  return `${date.getFullYear()}/${toTwoValue(
    date.getMonth() + 1
  )}/${toTwoValue(date.getDate())}`;
};

export const parsePhoneNumberToStandard = (phoneNumbers: any)=> {
  try {
    // const { uuid } = uuidAPIKey.create();
    const results = [];
    // for(let i = 0; i <= phoneNumbers.length - 1; i++) {
    if (phoneNumbers.length === 11) {
      phoneNumbers = {to: `234${phoneNumbers.substring(1)}`, messageId: uuid};
    }
    if (phoneNumbers.length === 13 && phoneNumbers.substring(0, 1) !== '+') {
      phoneNumbers = {to: `${phoneNumbers}`, messageId: uuid};
    }
    if (phoneNumbers.length === 14 && phoneNumbers.substring(0, 1) === '+') {
      phoneNumbers = {to: `${phoneNumbers.substring(1, 14)}`, messageId: uuid};
    }

    results.push({
      to: phoneNumbers,
      messageId: uuid
    });
    // }

    return phoneNumbers;
  } catch (error) {
    console.log(error);
  }
};

//  function(s){
// let AMPM = s.slice(-2);
// let timeArr = s.slice(0, -2).split(":");

// if (AMPM === "AM" && timeArr[0] === "12") {
//     // catching edge-case of 12AM
//     timeArr[0] = "00";
// } else if (AMPM === "PM") {
//     // everything with PM can just be mod'd and added with 12 - the max will be 23
//     timeArr[0] = (timeArr[0] % 12) + 12
// }

// return timeArr.join(":");
//  }
