import Module from "../module";
import { RecieptInterface } from "../../models/reciept";
import { Model } from "mongoose";
import { UserInterface } from "../../models/user";
import { BadInputFormatException } from "../../exceptions";

interface accountPropInterface {
    account:Model<RecieptInterface>
}

interface newRecieptInterface {
    customer:RecieptInterface['customer']
    cylinderType:RecieptInterface['cylinderType']
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

    public async createReciept(data:newRecieptInterface):Promise<RecieptInterface|undefined>{
        try {
            const reciept = new this.account(data);
            reciept.outstandingBalance = reciept.totalAmount - reciept.amountPaid;
            let exists = await this.account.find();
            let sn;
            let nums = exists.map(doc=> doc.invoiceNo);
            let maxNum = Math.max(...nums)
            sn = maxNum + 1;
            reciept.invoiceNo = sn | 1;

            await reciept.save();
            return Promise.resolve(reciept);
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchInvoices(user:UserInterface):Promise<RecieptInterface[]|undefined>{
        try {
            const invoices = await this.account.find({branch:user.branch});
            return Promise.resolve(invoices);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async viewInvoiceDetails(invoiceId:string):Promise<RecieptInterface|undefined>{
        try{
            const invoice = await this.account.findById(invoiceId).populate({
                path:'preparedBy', model:'users'
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