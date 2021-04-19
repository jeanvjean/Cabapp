import Module, { QueryInterface } from '../module';
import { Model } from 'mongoose';
import { UserInterface } from '../../models/user';
import { BadInputFormatException, InvalidAccessCredentialsException } from '../../exceptions';
import { sign, verify } from 'jsonwebtoken';
import Notify from '../../util/mail';
import { generateToken } from '../../util/token';
import { constants } from '../../util/constants';
// import { decodeToken } from '../../middlewares/rpcdecode';
import { compareSync, genSaltSync, hash } from 'bcryptjs';
import { getTemplate } from '../../util/resolve-template';
export const signTokenKey = "loremipsumdolorsitemet"

interface UserConstructorInterface {
  model: Model<UserInterface>
}

interface NewUserInterface {
  name:UserInterface['name'],
  email:UserInterface['email'],
  password:UserInterface['password'],
  account_type:UserInterface['account_type']
}

interface inviteUserInput {
  users:[UserInterface]
}

export interface TokenInterface {
  token:string,
  expires:number
}

export interface idInterface {
  id:string
}

interface RolesInterfaceResponse{
  roles:object[]
}

//password reset interfaces
interface PasswordResetInputInterface {
  password:string,
  token:string
}

interface RequestPasswordResetInput{
  email:string
}

interface RequestResponseInterface{
  message:string,
  token:string
}

interface ResetResponseInterface{
  message:string
}

//password reset interfaces

interface UpdateUserInterface{
  id?:string,
  input?:object
}

interface ChangePasswordInterface{
  newPassword:string,
  oldPassword:string
}

interface LoginReturn {
  user: UserInterface,
  accessToken:TokenInterface
}

export type TokenPayloadInterface = {
  id: string,
  email:string
}

export interface LoginInterface {
  email: UserInterface['email'],
  password:UserInterface['password']
}

export interface InviteUserInterfaceRespone{
  message:string,
  failedInvites:string[]
}

class User extends Module {
  private model: Model<UserInterface>

  constructor(props: UserConstructorInterface){
    super();
    this.model = props.model;
  }
//@ts-ignore
  public async register(data: NewUserInterface) : Promise<UserInterface|undefined>{
    let newUser : UserInterface|undefined;
    try {
      let existUser:UserInterface | null = await this.model.findOne({email:data.email});
      if(existUser) {
        throw new BadInputFormatException('A user already exists with this email');
      }

      newUser = await this.model.create({
        ...data,
        subrole:'superadmin',
        isVerified:true
      });
      // let payload = {
      //   id:newUser._id,
      //   email:newUser.email
      // }
      // const expiresIn = 1000 * 60 * 60 * 24;
      // let token = sign(payload, signTokenKey, {expiresIn});
      // const html = await getTemplate('registration', {
      //   name: newUser.name,
      //   link:`${process.env.FRONTEND_URL}/verify/${token}`
      // });
      // let mailLoad = {
      //   content:html,
      //   subject:'test messaging',
      //   email:newUser.email,
      // }
      // new Notify().sendMail(mailLoad);
      return Promise.resolve(newUser as UserInterface);
    } catch (error) {
      this.handleException(error)
    }
  }

  public async inviteUser(data:inviteUserInput, user:UserInterface) : Promise<InviteUserInterfaceRespone|undefined>{
    try {
      const exists = [];
      for(let user of data.users) {
        let existUser:UserInterface | null = await this.model.findOne({email:user.email});
        if(existUser){
          exists.push(user.email);
        } else {
          let password = await generateToken(4);
          await this.model.create({...user, password});
          const html = await getTemplate('invite', {
            team: user.role,
            role:user.subrole,
            link:`${process.env.FRONTEND_URL}/login`,
            password
          });
          let mailLoad = {
            content:html,
            subject:'New User registeration',
            email:user.email,
          }
          new Notify().sendMail(mailLoad);
        }
      }
      return Promise.resolve({
        message:'An email has been sent to your new user(s)',
        failedInvites:exists
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchRoles(user:UserInterface) : Promise<RolesInterfaceResponse|undefined>{
    try {
      //@ts-ignore
      let roles:RolesInterfaceResponse = constants;
      return Promise.resolve(roles as RolesInterfaceResponse);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchUsers(query:QueryInterface, user:UserInterface) {
    try {
      let users = await this.model.find(query);
      return users;
    } catch (e) {
      this.handleException(e);
    }
  }

  public async login(data:LoginInterface) : Promise<LoginReturn | undefined>{

    try {
      let user = await this.model.findOne({email:data.email});
      if(!user) {
        throw new BadInputFormatException('User Not Found');
      }
      if(user.isVerified) {
        throw new BadInputFormatException('Account has not been verified');
      }
      let correctPassword = await user.comparePWD(data.password);
      if(!correctPassword) {
        throw new BadInputFormatException('Incorrect password');
      }
      let payload = {
        id: user._id.toString(),
        email:user.email.toString()
      }
      let expiresIn = 1000 * 60 * 60 * 24
      let token = sign(payload, signTokenKey, {expiresIn});
      return Promise.resolve({
        user,
        accessToken:{
          token,
          expires:expiresIn
        }
      });
    } catch (error) {
      this.handleException(error);
    }

  }

  public async fetchUser(data: TokenPayloadInterface): Promise<UserInterface>{

    const user = await this.model.findOne({
      _id:data.id,
      email: data.email
    });
      if(!user) {
        throw new BadInputFormatException('this user does not exist');
      }
      return Promise.resolve(user);
  }

  public async updateUser (data:UpdateUserInterface, user:UserInterface) : Promise<UserInterface|undefined>{
    //Todo implement user update
    try {

      let options = {new:true}
     // @ts-ignore
      let exists = await this.model.findById(user._id);
      if(!exists) {
        throw new BadInputFormatException('Not Found');
      }
      //@ts-ignore
      if(data.email && user.email !== data.email){
        //@ts-ignore
        let thisUser = await this.model.findOne({email:data.email});
        if(thisUser) {
          throw new BadInputFormatException('the email is in use by another client');
        }
      }
      let updateUser = await this.model.findByIdAndUpdate(
        user._id,
        {
          $set:data
        },
        options
      )
      return Promise.resolve(updateUser as UserInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async requestPasswordReset(data:RequestPasswordResetInput):Promise<RequestResponseInterface|undefined> {
    try {
      const user = await this.model.findOne({email:data.email});
      if(!user) {
        throw new BadInputFormatException('No user exists with this email');
      }
      const payload = {
        id:user._id,
        email:user.email
      }
      let expiresIn = 1000 * 60 * 60 * 24
      const token = sign(payload, signTokenKey, {expiresIn} );
      const html = await getTemplate('reset-password', {
        name: user.role,
        link:`${process.env.FRONTEND_URL}/reset-password/${token}`,
      });
      let mailLoad = {
        content:html,
        subject:'Reset Password',
        email:user.email,
      }
      new Notify().sendMail(mailLoad);
      return Promise.resolve({
        message:'A reset email has been sent',
        token
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async resetPassword(data:PasswordResetInputInterface): Promise<ResetResponseInterface|undefined> {
    try {
      const decode = verify(data.token, signTokenKey);
      //@ts-ignore
      const user = await this.model.findOne({_id:decode.id, email:decode.email});
      const salt = genSaltSync(10);
      let password = await hash(data.password, salt);
      //@ts-ignore
      await this.model.findByIdAndUpdate(user._id,{password, isVerified:true},{new:true});
      return Promise.resolve({
        message:'password reset success'
      })
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

  public async changePassword(data:ChangePasswordInterface, user:UserInterface):Promise<UserInterface|undefined>{
    try {
      const { oldPassword, newPassword } = data;
      const matchPassword = compareSync(oldPassword, user.password);
      if(!matchPassword) {
        throw new BadInputFormatException('Old password does not match');
      }
      const salt = genSaltSync(10);
      const password = await hash(newPassword, salt);
      let updated = await this.model.findByIdAndUpdate(user._id, {password, isVerified:true}, {new:true});
      return Promise.resolve(updated as UserInterface);
    } catch (e) {
     this.handleException(e);
    }
  }

}

export default User;
