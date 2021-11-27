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
import { DeletedUser } from '../../models/removedUser';
import { mongoose } from '../cylinder';
import { user } from '..';
import paginate from '../../util/paginate';
export const signTokenKey = "loremipsumdolorsitemet";

interface UserConstructorInterface {
  user: Model<UserInterface>
  deleted:Model<DeletedUser>
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
  suspend:boolean,
  reason?:string
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
  expires:string
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
  private deleted:Model<DeletedUser>

  constructor(props: UserConstructorInterface){
    super();
    this.user = props.user;
    this.deleted = props.deleted
  }

  public async registerSupremeUser(data: NewUserInterface) : Promise<UserInterface|undefined>{
    let newUser : UserInterface|undefined;
    try {
      let existUser:UserInterface | null = await this.user.findOne({email:data.email});
      if(existUser) {
        throw new BadInputFormatException('A user exists with this email... use another email');
      }
      let hasSupreme = await this.user.findOne({subrole:"supreme", role:"supreme"}); 
      if(hasSupreme) {
        throw new BadInputFormatException('there can only be one supreme user');
      }
      newUser = await this.user.create({
        ...data,
        subrole:'supreme',
        role:"supreme",
        isVerified:true
      });
      return Promise.resolve(newUser as UserInterface);
    } catch (error) {
      this.handleException(error)
    }
  }

  public async register(data: NewUserInterface) : Promise<UserInterface|undefined>{
    let newUser : UserInterface|undefined;
    try {
      let existUser:UserInterface | null = await this.user.findOne({email:data.email, branch:data.branch});
      if(existUser) {
        throw new BadInputFormatException('A user already exists with this email');
      }

      let hasSuperadmin = await this.user.findOne({branch:data.branch, subrole:"superadmin"}); 
      if(hasSuperadmin) {
        throw new BadInputFormatException('only one superadmin can exist in a branch');
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
      // new Notify().fetchData()
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
                    email:user.email,
                    link:`${Environment.FRONTEND_URL}`,
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
                    email:user.email,
                    link:`${Environment.FRONTEND_URL}`,
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
          } else if(user.subrole == 'superadmin'){
            if(userInfo.subrole !== 'supreme') {
              const html = await getTemplate('invite_decline', {
                message:"only supreme user can add a superadmin to a branch",
              });
              let mailLoad = {
                content:html,
                subject:'Invite Declined',
                email:userInfo.email,
              }
              new Notify().sendMail(mailLoad);
            }else {
              let password = await generateToken(4);
                  //@ts-ignore
                  await this.user.create({...user, branch:branch?.branch._id, password});
                  const html = await getTemplate('invite', {
                    team: user.role,
                    role:user.subrole,
                    email:user.email,
                    link:`${Environment.FRONTEND_URL}`,
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
          }else {
            let password = await generateToken(4);
            //@ts-ignore
            await this.user.create({...user, branch:branch?.branch._id, password});
            const html = await getTemplate('invite', {
              team: user.role,
              role:user.subrole,
              email:user.email,
              link:`${Environment.FRONTEND_URL}`,
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
      const ObjectId = mongoose.Types.ObjectId;
      let { search, email, name, phone, verified, active, subrole, unverified, suspended, departments, fromDate, toDate } = query;
      let options = {
        page:query.page || 1,
        limit:query.limit || 10
      }
      let q = {}
      //@ts-ignore
      let or = [];
      // console.log(q)
      if(verified) {
        //@ts-ignore
        q = {...q, isVerified: !!verified};
        // q.$or.push({isVerified: !!verified});
      }
      if(active) {
        //@ts-ignore
        // q.$or.push({deactivated: !!active});
        q = {...q, deactivated: !active};
      }
      if(suspended) {
        //@ts-ignore
        // q.$or.push({deactivated: !suspended});
        q = {...q, deactivated: !!suspended};
      }
      if(unverified) {
        //@ts-ignore
        // q.$or.push({deactivated: !unverified});
        q = {...q, isVerified: !unverified};
      }
      if(email) {
        //@ts-ignore
        // q.$or.push({email: new RegExp(email, "gi")});
        q = {...q, email: new RegExp(email, 'gi')};
      }
      if(subrole) {
        //@ts-ignore
        // q.$or.push({subrole: new RegExp(subrole, "gi")});
        q = {...q, subrole: new RegExp(subrole, "gi")};
      }
      if(departments) {
          //@ts-ignore
          q = {...q, role: {$in:departments}};
      }
      if(fromDate) {
        //@ts-ignore
          // q.$or.push({createdAt: {$gte: new Date(fromDate)}});
          q = {...q, createdAt: { $gte: new Date(fromDate)}};
          
      }      
      if(toDate) {
        //@ts-ignore
          // q.$or.push({createdAt: {$lte: new Date(toDate)}});
          //@ts-ignore
          q = {...q, createdAt: { $lte: new Date(toDate) }};
      }
      if(name) {
        // q.$or.push({"name": new RegExp(name || "", "gi")})
        //@ts-ignore
        // q = {...q, createdAt:{$gte:new Date(fromDate), $lte:new Date(toDate)}}
        //@ts-ignore
        q = {...q, name: new RegExp(name, 'gi')};
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      // let aggregate;
      // let aggregate = this.user.aggregate([q]);

      //@ts-ignore
      let users = await this.user.paginate(q, options);
      return Promise.resolve(users);

      //@ts-ignore
      // users = await this.user.searchPartial(search, {}, {sort:{createdAt:1}, branch:user.branch.toString()});
      // users = await this.user.searchFull(search, {}, {sort:{createdAt:1}, branch:user.branch.toString()});
    } catch (e) {
      this.handleException(e);
    }
  }

  public async branchUsers(query:QueryInterface, user:UserInterface):Promise<UserInterface[]|undefined>{
    try {     
      const ObjectId = mongoose.Types.ObjectId;
      let { search, email, name, phone, verified, active, subrole, unverified, suspended, departments, fromDate, toDate } = query;
      let options = {
        page:query.page || 1,
        limit:query.limit || 10
      }
      let q = {
        branch: user.branch
      }

      //@ts-ignore
      let or = [];
      // console.log(q)
      if(verified) {
        //@ts-ignore
        q = {...q, isVerified: !!verified};
        // q.$or.push({isVerified: !!verified});
      }
      if(active) {
        //@ts-ignore
        // q.$or.push({deactivated: !!active});
        q = {...q, deactivated: !active};
      }
      if(suspended) {
        //@ts-ignore
        // q.$or.push({deactivated: !suspended});
        q = {...q, deactivated: !!suspended};
      }
      if(unverified) {
        //@ts-ignore
        // q.$or.push({deactivated: !unverified});
        q = {...q, isVerified: !unverified};
      }
      if(email) {
        //@ts-ignore
        // q.$or.push({email: new RegExp(email, "gi")});
        q = {...q, email: new RegExp(email, 'gi')};
      }
      if(subrole) {
        //@ts-ignore
        // q.$or.push({subrole: new RegExp(subrole, "gi")});
        q = {...q, subrole: new RegExp(subrole, "gi")};
      }
      if(departments) {
          //@ts-ignore
          q = {...q, role: {$in:departments}};
      }
      if(fromDate) {
        //@ts-ignore
          // q.$or.push({createdAt: {$gte: new Date(fromDate)}});
          q = {...q, createdAt: { $gte: new Date(fromDate)}};
          
      }      
      if(toDate) {
        //@ts-ignore
          // q.$or.push({createdAt: {$lte: new Date(toDate)}});
          //@ts-ignore
          q = {...q, createdAt: { $lte: new Date(toDate) }};
      }
      if(name) {
        // q.$or.push({"name": new RegExp(name || "", "gi")})
        //@ts-ignore
        // q = {...q, createdAt:{$gte:new Date(fromDate), $lte:new Date(toDate)}}
        //@ts-ignore
        q = {...q, name: new RegExp(name, 'gi')};
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      //@ts-ignore
      let users = await this.user.paginate(q, options);
      return Promise.resolve(users);
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
      let expiresIn = 180 //1000 * 60 * 60 * 24
      let token = sign(payload, signTokenKey, {expiresIn});
      await createLog({
        user:user._id,
        activities:{
          title:'Logged in',
          activity:'You logged into your account',
          time: new Date().toISOString()
        }
      });
      let date = new Date();
      date.setDate(date.getDate() + expiresIn);
      return Promise.resolve({
        user,
        accessToken:{
          token,
          expires: date.toISOString()
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
        link:`${Environment.FRONTEND_URL}/reset-password/${token}`,
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
      const suspendUser = await this.user.findById(data.userId);
      if(!suspendUser) {
        throw new BadInputFormatException('user not found');
      }
      let suspend;
      if(suspendUser.deactivated) {
        suspend = false;
      }else{
        suspend = true
      }
      // suspendUser.deactivated = data.suspend;
      // suspendUser.suspensionReason = data.reason;
      let updatedUser = await this.user.findByIdAndUpdate(suspendUser._id,{deactivated:suspend, suspensionReason:data?.reason}, {new:true});
      console.log(updatedUser)
      //@ts-ignore
      let message = updatedUser.deactivated? `suspended` : 're-activated';
      const html = await getTemplate('suspend', {
        name: suspendUser.name,
        officer:user.name,
        action:message
      });
      let mailLoad = {
        content:html,
        subject:'Account suspension',
        email:suspendUser.email,
      }
      await createLog({
        user:user._id,
        activities:{
          title:'Suspended User',
          activity:`You ${message} ${updatedUser?.name}`,
          time: new Date().toISOString()
        }
      });
      await createLog({
        user:updatedUser?._id,
        activities:{
          title:'Suspended User',
          activity:`You were ${message} by ${user?.name}`,
          time: new Date().toISOString()
        }
      });
      new Notify().sendMail(mailLoad);
      return Promise.resolve({
        message,
        user:updatedUser as UserInterface
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

  public async deleteUser(id:string, reason:string, userInfo:UserInterface):Promise<any>{
    try{
      const user = await this.user.findById(id);
      if(!user) {
        throw new BadInputFormatException('user not found');
      }
      await this.deleted.create({
        name:user.name,
        email:user.email,
        role:user.subrole,
        department:user.role,
        branch:user.branch,
        reason
      });
      await createLog({
        user:userInfo?._id,
        activities:{
          title:'Deleted User',
          activity:`You deleted ${user?.name}`,
          time: new Date().toISOString()
        }
      });
      await this.user.findByIdAndDelete(id);
      return Promise.resolve({
        message:'User deleted'
      });
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchDeletedUsers(query:QueryInterface, user:UserInterface):Promise<DeletedUser[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search } = query;
      let options = {
        ...query
      }
      let aggregate = this.deleted.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {email:{
                    $regex: search?.toLowerCase || ""
                  }},
                  {name:{
                    $regex: search?.toLowerCase || ""
                  }},
                  {role:{
                    $regex: search?.toLowerCase || ""
                  }},
                  {department:{
                    $regex: search?.toLowerCase || ""
                  }}
                ]
              },
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      //@ts-ignore
      const users = await this.deleted.aggregatePaginate(aggregate, options);
      return Promise.resolve(users);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async userStatistics(user:UserInterface):Promise<any>{
    try {
      const deletedUsers = await this.deleted.find({branch:user.branch});
      const users = await this.user.find({branch:user.branch});
      const activeUsers = users.filter(user=> user.isVerified);
      const inactiveUsers = users.filter(user=> !user.isVerified)
      return Promise.resolve({
        deletedUsers:deletedUsers.length || 0,
        activeUsers:activeUsers.length || 0,
        inactiveUsers:inactiveUsers.length || 0,
        totalUsers: users.length || 0
      });
    } catch (e) {
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
      await createLog({
        user:user?._id,
        activities:{
          title:'Suspended User',
          activity:`You have subscribed to notifications`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(user)
    } catch (e) {
      this.handleException(e);
    }
  }

}

export default User;
