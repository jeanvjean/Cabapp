import {
  Schema,
  Connection,
  Model,
  Document
}
from "mongoose";
import * as mongoosePaginator from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

import { hash, compare, genSaltSync } from 'bcryptjs';
import { mongoose } from "../modules/cylinder";
 export const salt = genSaltSync(10);
 const permissions = require('../util/permissions.json');

 const ObjectId = mongoose.Types.ObjectId;

/**
 * Attributes of a user
 * @meta Model Model
 */

 export enum UserRoles {
   ADMIN='admin',
   SALES = 'sales',
   PRODUCTION = 'production',
   ACCOUNT = 'account',
   SECURITY = 'security',
   AUDIT = 'audit'
 }


 type PermissionInterface = {
   permission:string,
   sub_permissions:string[]
 }

 type Permissions = PermissionInterface[]

 export interface UserInterface extends Document{
   /**
    * @param name
    * the name of the user signing up
    */
    name: string,
    /**
     * @param email email of the account being signed up for the service
     *
     */
    email:string,
    /**
     * @param password login password for the account
     */
    password:string,
    /**
     * @param account_type the type of account being registered (client , admin)
     */
    account_type?:string,

    /**
     * @param token Signin token
     */
    token: string,

    role:string

    subrole:string

    location:string,

    gender:string,

    phoneNumber:number

    vehicle:Schema.Types.ObjectId

    branch:Schema.Types.ObjectId

    permissions:Permissions[]

    image:string

    suspensionReason?:string

    deactivated:boolean

    /**
     * @param isVerified account verified Boolean
     */
    isVerified: boolean,
    /**
     * @param createdAt Date of creation
     */
    createdAt?: Date,
    /**
     * @param updatedAt date updated
     */
    updatedAt?:Date,
    /**
     * @param comparePWD check userPassword
     */
    comparePWD: Function
 }

 export const userSchema = new Schema({
    name: {
      type:String,
      lowercase:true
    },
    email:{
      type:String,
      lowercase:true,
      unique:true
    },
    password: {
      type:String,
      required:true,
      select:false
    },
    account_type:{
      type:String
    },
    role:{
      type:String
    },
    subrole:{
      type:String
    },
    token:{
      type:String
    },
    vehicle:{type:Schema.Types.ObjectId, ref:'vehicle'},
    deactivated:{
      type:Boolean,
      default:false
    },
    isVerified:{
      type:Boolean,
      default:false
    },
    location:{type:String},
    gender:{type:String},
    phoneNumber:{type:Number},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    permissions:[{
      name:String,
      sub_permissions:[String]
    }],
    image:{type:String},
    suspensionReason:String
 },{
   timestamps:true
 });

 userSchema.statics = {
   searchPartial:async function(q:any, query:any, options:any) {
    return this.aggregate([
      {
        $match:{
          $and:[
            {
              $or:[
                {name: new RegExp(q, "i")},
                {email:new RegExp(q, 'i')},
                {role:new RegExp(q, 'i')},
                {subrole:new RegExp(q, 'i')}
              ],
            },{
              branch: ObjectId(options.branch)
            }
          ],
          ...query
        }
      },
      {
        $sort:options.sort || {createdAt:1}
      },
      {
        $group: {
          _id: null,
          // get a count of every result that matches until now
          totalCount: { $sum: 1 },
          // keep our results for the next operation
          results: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          totalCount: 1,
          rows: {
            $slice: ['$results', options.skip || 0, options.limit || '$totalCount']
          }
        }
      }
    ]);
   },
   searchFull: function (q:any, query:any, options:any) {
    return this.aggregate([
      {
        $match: {
          $text: { $search: q, $caseSensitive: false },
          ...query
        }
      },
      { $sort: options.sort },
      {
        $group: {
          _id: null,
          // get a count of every result that matches until now
          totalCount: { $sum: 1 },
          // keep our results for the next operation
          results: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          totalCount: 1,
          rows: {
            $slice: ['$results', options.skip || 0, options.limit || '$totalCount']
          }
        }
      }
    ]);
  }
 }

 userSchema.index({role:'text', subrole:'text'});

 userSchema.plugin(mongoosePaginator);
 userSchema.plugin(aggregatePaginate)

 userSchema.methods.comparePWD = async function(
   value: string
 ): Promise<boolean>{
   let isMatch = await compare(value, this.password);
   return Promise.resolve(isMatch);
 }

 userSchema.pre<UserInterface>('save',async function(next): Promise<void>{
   if(this.isModified('password')){
    this.password = await hash(this.password, salt)
   }
   if(this.subrole == 'superadmin') {
    this.permissions = permissions.permissions
   }
   next();
 })

 userSchema.pre<UserInterface>('update',async function(next): Promise<void>{
  if(this.isModified('password')){
    this.password = await hash(this.password, salt)
   }
   next();
 })

 export default function factory(conn:Connection): Model<UserInterface>{
    return conn.model('User', userSchema);
 }
