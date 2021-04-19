import {
  Schema,
  Connection,
  Model,
  Document
}
 from "mongoose";
 import { hash, compare, genSaltSync } from 'bcryptjs';
 export const salt = genSaltSync(10);

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
      lowercase:true
    },
    password: {
      type:String,
      required:true
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
    deactivated:{
      type:Boolean,
      default:false
    },
    isVerified:{
      type:Boolean,
      default:false
    }
 },{
   collection:'users',
   timestamps:true
 });

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
