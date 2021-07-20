import Module, { QueryInterface } from "../module";
import { RecieptInterface } from "../../models/reciept";
import { Model } from "mongoose";
import { UserInterface } from "../../models/user";
import { BadInputFormatException } from "../../exceptions";
import { createLog } from "../../util/logs";
import { padLeft } from "../../util/token";
import { mongoose } from "../cylinder";

interface accountPropInterface {
    account:Model<RecieptInterface>
}

interface newRecieptInterface {
    customer:RecieptInterface['customer']
    cylinderType?:RecieptInterface['cylinderType']
    receiptType?:RecieptInterface['type']
    cylinders?:RecieptInterface['cylinders']
    products?:RecieptInterface['products']
    totalAmount:RecieptInterface['totalAmount']
    amountPaid:RecieptInterface['amountPaid']
    date:RecieptInterface['date']
    amountInWords:RecieptInterface['amountInWords']
}

interface invoiceUpdateInput {
    invoiceId:string,
    update:RecieptInterface
}

type invoiceResponse = {
    message:string
    invoice:RecieptInterface
}


class Account extends Module{
    private account:Model<RecieptInterface>

    constructor(props:accountPropInterface) {
        super()
        this.account = props.account
    }

    public async createReciept(data:newRecieptInterface, user:UserInterface):Promise<RecieptInterface|undefined>{
        try {
            const reciept = new this.account({...data, branch:user.branch});
            reciept.outstandingBalance = reciept.totalAmount - reciept.amountPaid;
            let exists = await this.account.find({}).sort({invInit:-1}).limit(1);
            let sn;
            if(exists[0]) {
              sn = exists[0].invInit++
            }else {
              sn = 1;
            }
            let init = 'INV';
            let invoiceNumber = padLeft(sn, 6, "");
            reciept.invoiceNo = init+invoiceNumber;

            await reciept.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Reciept',
                //@ts-ignore
                activity:`You issued a reciept for purchase`,
                time: new Date().toISOString()
              }
            });
            return Promise.resolve(reciept);
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchInvoices(query:QueryInterface, user:UserInterface):Promise<RecieptInterface[]|undefined>{
        try {
          const { search } = query;
          const ObjectId = mongoose.Types.ObjectId;
          const options = {
            ...query
          }
          const aggregate = this.account.aggregate([
            {
              $match:{
                $and:[
                  {
                    $or:[
                      {invoiceNo:{
                        $regex: search?.toLowerCase() || ""
                      }}
                    ]
                  },
                  {branch: ObjectId(user.branch.toString())}
                ]
              }
            }
          ]);
          //@ts-ignore
            const invoices = await this.account.aggregatePaginate(aggregate,options);
            return Promise.resolve(invoices);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async viewInvoiceDetails(invoiceId:string):Promise<RecieptInterface|undefined>{
        try{
            const invoice = await this.account.findById(invoiceId).populate({
                path:'preparedBy', model:'User'
            });
            return Promise.resolve(invoice as RecieptInterface);
        }catch(e){
            this.handleException(e)
        }
    }

    public async updateInvoice(data:invoiceUpdateInput):Promise<invoiceResponse|undefined>{
        try {
            const { invoiceId, update } = data;
            const invoice = await this.account.findById(invoiceId);
            if(!invoice) {
                throw new BadInputFormatException('invoice not found');
            }
            if(update?.amountPaid) {
                invoice.outstandingBalance = invoice.outstandingBalance - update.amountPaid;
                await invoice.save();
            }
            // let updated =  await this.account.findByIdAndUpdate(invoiceId, {$set:update}, {new:true});

            let message = invoice?.outstandingBalance <= 0 ? 'Paid out' : 'payment updated';

            return Promise.resolve({
                message,
                invoice:invoice as RecieptInterface
            });
        } catch (e) {
            this.handleException(e);
        }
    }
}

export default Account;
