import {
Schema,
Document,
Model,
Connection
} from 'mongoose';

export interface activities {
  title:string
  activity:string
  time:Date
  createdAt:Date
  updatedAt:Date
}

export interface ActivityLogInterface extends Document {
  user:Schema.Types.ObjectId
  activities:activities[]
}

const activitiesSchema = new Schema({
  title:String,
  activity:String,
  time:Date
},{
  timestamps:true
});

const activityLogsSchema = new Schema({
  user:{type:Schema.Types.ObjectId},
  activities:{type:[activitiesSchema]}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<ActivityLogInterface> {
  return conn.model('activity-logs', activityLogsSchema);
}
