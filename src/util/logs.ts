import { Activity } from '../models';
import { ActivityLogInterface, activities } from '../models/logs';

interface activityLogInput {
  user:ActivityLogInterface['user']
  activities:{
    title:string,
    activity:string
    time:string
  }
}

export const createLog = async(data:activityLogInput) =>{
  const activity = await Activity.findOne({user:data.user});
  if(!activity) {
    let act = await Activity.create(data);
  }else {
    //@ts-ignore
    activity.activities.push(data.activities);
    activity.save();
  }
}
