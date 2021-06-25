import Module, { QueryInterface } from '../module';
import { Model } from 'mongoose';
import { UserInterface } from '../../models/user';
import { BadInputFormatException, InvalidAccessCredentialsException } from '../../exceptions';
import { sign, verify } from 'jsonwebtoken';
import Notify from '../../util/mail';
import { generateToken } from '../../util/token';
import { constants } from '../../util/constants';
import Environment from '../../configs/static';
import { compareSync, genSaltSync, hash } from 'bcryptjs';
import { getTemplate } from '../../util/resolve-template';
import { createLog } from '../../util/logs';
export const signTokenKey = "loremipsumdolorsitemet";

interface UserConstructorInterface {
  user: Model<UserInterface>
}

interface NewUserInterface {
  name:UserInterface['name'],
  email:UserInterface['email'],
  password:UserInterface['password'],
  account_type:UserInterface['account_type']
  branch:UserInterface['branch']
}

type SuspendUserInput = {
  userId:string,
  suspend:boolean
}

type suspendUserResponse = {
  message:string
  user:UserInterface
}

interface inviteUserInput {
  users:UserInterface[]
}

interface RoleUpdateInterface {
  userId:string,
  role:string,
  subrole:string
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
  input?:UserInterface
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
  private user: Model<UserInterface>

  constructor(props: UserConstructorInterface){
    super();
    this.user = props.user;
  }

  public async register(data: NewUserInterface) : Promise<UserInterface|undefined>{
    let newUser : UserInterface|undefined;
    try {
      let existUser:UserInterface | null = await this.user.findOne({email:data.email});
      if(existUser) {
        throw new BadInputFormatException('A user already exists with this email');
      }

      newUser = await this.user.create({
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
      //   link:`${Environment.FRONTEND_URL}/verify/${token}`
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

  public async inviteUser(data:inviteUserInput, userInfo:UserInterface) : Promise<InviteUserInterfaceRespone|undefined>{
    try {
      const branch = await this.user.findById(userInfo._id).populate({
        path:'branch', model:'branches'
      });
      const exists = [];
      for(let user of data.users) {
        let existUser:UserInterface | null = await this.user.findOne({email:user.email});
        if(existUser){
          if(!existUser.isVerified) {
            let password = await generateToken(4);
                  //@ts-ignore
                  await this.user.findByIdAndUpdate(existUser._id,{password}, {new:true});
                  const html = await getTemplate('invite', {
                    team: user.role,
                    role:user.subrole,
                    link:Environment.FRONTEND_URL,
                    //@ts-ignore
                    branch:branch?.branch.name,
                    password
                  });
                  let mailLoad = {
                    content:html,
                    subject:'RE:Invitiation',
                    email:user.email,
                  }
                  new Notify().sendMail(mailLoad);
          } else {
            exists.push(user.email);
          }
        } else {
          if(user.subrole == 'head of department') {
                let hod = await this.user.findOne({
                  role:user.role,
                  subrole:user.subrole,
                  branch:branch?.branch
                });
                if(!hod) {
                  let password = await generateToken(4);
                  //@ts-ignore
                  await this.user.create({...user, branch:branch?.branch._id, password});
                  const html = await getTemplate('invite', {
                    team: user.role,
                    role:user.subrole,
                    link:Environment.FRONTEND_URL,
                    //@ts-ignore
                    branch:branch?.branch.name,
                    password
                  });
                  let mailLoad = {
                    content:html,
                    subject:'New User registeration',
                    email:user.email,
                  }
                  new Notify().sendMail(mailLoad);
            }else {
              exists.push(user.email);
            }
          } else {
            let password = await generateToken(4);
            //@ts-ignore
            await this.user.create({...user, branch:branch?.branch._id, password});
            const html = await getTemplate('invite', {
              team: user.role,
              role:user.subrole,
              link:Environment.FRONTEND_URL,
              //@ts-ignore
              branch:branch?.branch.name,
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
      }
      await createLog({
        user:userInfo._id,
        activities:{
          title:'Invited new Users',
          activity:'You invited some new users to join the team',
          time: new Date().toISOString()
        }
      });
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
      let options = {
        ...query
      }
      //@ts-ignore
      let users = await this.user.paginate({},options);
      return users
    } catch (e) {
      this.handleException(e);
    }
  }

  public async branchUsers(query:QueryInterface, user:UserInterface):Promise<UserInterface[]|undefined>{
    try {
      //@ts-ignore
      let users = await this.user.paginate({branch:user.branch}, {...query});
      return users;
    } catch (e) {
      this.handleException(e);
    }
  }

  public async login(data:LoginInterface) : Promise<LoginReturn | undefined>{

    try {
      const { email, password } = data;
      let user = await this.user.findOne({email:email}).select('+password');
      if(!user) {
        throw new BadInputFormatException('User Not Found');
      }
      // if(!user.isVerified) {
      //   throw new BadInputFormatException('Account has not been verified');
      // }
      let correctPassword = await user.comparePWD(password);
      if(!correctPassword) {
        throw new BadInputFormatException('Incorrect password');
      }
      let payload = {
        id: user._id.toString(),
        email:user.email.toString()
      }
      let expiresIn = 1000 * 60 * 60 * 24
      let token = sign(payload, signTokenKey, {expiresIn});
      await createLog({
        user:user._id,
        activities:{
          title:'Logged in',
          activity:'You logged into your account',
          time: new Date().toISOString()
        }
      });
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

    const user = await this.user.findOne({
      _id:data.id,
      email: data.email
    });
      if(!user) {
        throw new BadInputFormatException('No User found');
      }
      return Promise.resolve(user);
  }

  public async updateUser (data:UpdateUserInterface, user:UserInterface) : Promise<UserInterface|undefined>{
    //Todo implement user update
    try {

      let options = {new:true}
     // @ts-ignore
      let exists = await this.user.findById(user._id);
      if(!exists) {
        throw new BadInputFormatException('Not Found');
      }
      //@ts-ignore
      if(data.email && user.email !== data.email){
        //@ts-ignore
        let thisUser = await this.user.findOne({email:data.email});
        if(thisUser) {
          throw new BadInputFormatException('the email is in use by another client');
        }
      }
      let set = {
        ...data,
        isVerified:true
      }
      let updateUser = await this.user.findByIdAndUpdate(
        user._id,
        {
          $set:set
        },
        options
      )
      await createLog({
        user:user._id,
        activities:{
          title:'Update profine',
          activity:'You updated your profile',
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(updateUser as UserInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async changeUserRole(data:RoleUpdateInterface, user:UserInterface):Promise<UserInterface|undefined>{
    try {
      let updatedUser;
      const user = await this.user.findById(data.userId);
      if(!user) {
        throw new BadInputFormatException('user not found')
      }
      if(user.subrole == 'superadmin') {
        throw new BadInputFormatException('this role cannot be changed');
      }
      if(data.subrole == 'head of department') {
        if(user?.subrole !== 'head of department') {
          let hod = await this.user.findOne({role:user?.role, subrole:'head of department'});
          if(!hod){
            updatedUser = await this.user.findByIdAndUpdate(
              user?._id,
              {
                $set:data
              },
              {new:true}
            )
            return Promise.resolve(updatedUser as UserInterface);
          }else {
            throw new BadInputFormatException('this department already has a head')
          }
        }
      }else {
        updatedUser = await this.user.findByIdAndUpdate(
          user?._id,
          {
            $set:{role:data.role, subrole:data.subrole}
          },
          {new:true}
        );
        await createLog({
          user:user._id,
          activities:{
            title:'Change role',
            activity:`You changed ${updatedUser?.name}\'s role`,
            time: new Date().toISOString()
          }
        });
        return Promise.resolve(updatedUser as UserInterface);
      }
    } catch (e) {
      this.handleException(e);
    }
  }

  public async requestPasswordReset(data:RequestPasswordResetInput):Promise<RequestResponseInterface|undefined> {
    try {
      const user = await this.user.findOne({email:data.email});
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
        link:Environment.FRONTEND_URL+'reset-password/'+ token,
      });
      let mailLoad = {
        content:html,
        subject:'Reset Password',
        email:user.email,
      }
      await new Notify().sendMail(mailLoad);
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
      const user = await this.user.findOne({_id:decode.id, email:decode.email}).select('+password');
      const salt = genSaltSync(10);
      let password = await hash(data.password, salt);
      //@ts-ignore
      await this.user.findByIdAndUpdate(user._id,{password, isVerified:true},{new:true});
      await createLog({
        //@ts-ignore
        user:user._id,
        activities:{
          title:'change password',
          activity:`You changed your password`,
          time: new Date().toISOString()
        }
      });
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
      const findUser = await this.user.findById(user._id).select('+password');
      const { oldPassword, newPassword } = data;
      //@ts-ignore
      const matchPassword = compareSync(oldPassword, findUser.password);
      if(!matchPassword) {
        throw new BadInputFormatException('Old password does not match');
      }
      const salt = genSaltSync(10);
      const password = await hash(newPassword, salt);
      let updated = await this.user.findByIdAndUpdate(user._id, {password, isVerified:true}, {new:true});
      await createLog({
        user:user._id,
        activities:{
          title:'Change password',
          activity:`Password Changed`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(updated as UserInterface);
    } catch (e) {
     this.handleException(e);
    }
  }

  public async suspendUser(data:SuspendUserInput, user:UserInterface):Promise<suspendUserResponse|undefined>{
    try{
      const user = await this.user.findById(data.userId);
      if(!user) {
        throw new BadInputFormatException('user not found');
      }
      let updatedUser = await this.user.findByIdAndUpdate(user._id,{deactivated:data.suspend}, {new:true});
      //@ts-ignore
      let message = updatedUser.deactivated? 'suspended' : 're-activated';

      return Promise.resolve({
        message,
        user
      });
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchallUsers():Promise<UserInterface[]|undefined>{
    try {
      const users = await this.user.find({});
      return Promise.resolve(users);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async deleteUser(id:string):Promise<any>{
    try{
      const user = await this.user.findById(id);
      if(!user) {
        throw new BadInputFormatException('user not found');
      }
      await this.user.findByIdAndDelete(id);
      return Promise.resolve({
        message:'User deleted'
      })
    }catch(e){
      this.handleException(e);
    }
  }

  public async updateToken(userId:string, token:string):Promise<UserInterface|undefined>{
    try {
      const user = await this.user.findByIdAndUpdate(userId, { token }, {new:true});
      console.log(user);
      if(!user){
        throw new BadInputFormatException('user not found');
      }
      return Promise.resolve(user)
    } catch (e) {
      this.handleException(e);
    }
  }

}

export default User;
