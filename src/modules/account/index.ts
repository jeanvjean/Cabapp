import Module, { QueryInterface } from "../module";
import { RecieptInterface } from "../../models/reciept";
import { Model } from "mongoose";
import { UserInterface } from "../../models/user";
import { BadInputFormatException } from "../../exceptions";
import { createLog } from "../../util/logs";
import { padLeft } from "../../util/token";
import { mongoose } from "../cylinder";
import { SalesRequisitionInterface } from "../../models/sales-requisition";
import { WayBillInterface } from "../../models/waybill";

interface accountPropInterface {
    account:Model<RecieptInterface>,
    salesRequisition:Model<SalesRequisitionInterface>
    deliveryNote:Model<WayBillInterface>
}

interface newRecieptInterface {
    customer:RecieptInterface['customer']
    recieptType:RecieptInterface['recieptType']
    cylinders?:RecieptInterface['cylinders']
    products?:RecieptInterface['products']
    totalAmount:RecieptInterface['totalAmount']
    amountPaid:RecieptInterface['amountPaid']
    date:RecieptInterface['date']
    amountInWords:RecieptInterface['amountInWords']
    salesReq?:RecieptInterface['salesReq'],
    delivery_id?:RecieptInterface['delivery_id']
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
    private salesRequisition:Model<SalesRequisitionInterface>
    private deliveryNote: Model<WayBillInterface>

    constructor(props:accountPropInterface) {
        super()
        this.account = props.account
        this.salesRequisition = props.salesRequisition
        this.deliveryNote = props.deliveryNote
    }

    public async createReciept(data:newRecieptInterface, user:UserInterface):Promise<RecieptInterface|undefined>{
        try {
            if(data.recieptType == 'product') {
                if(!data.products) {
                    throw new BadInputFormatException('products array is required')
                }
                data = {
                    ...data,
                    cylinders:[]
                }
            }
            if(data.recieptType == 'cylinder') {
                if(!data.cylinders) {
                    throw new BadInputFormatException('cylinders array is required')
                }
                data = {
                    ...data,
                    products:[]
                }
            }
            const reciept = new this.account({...data, branch:user.branch});
            // console.log(reciept);
            reciept.outstandingBalance = reciept.totalAmount - reciept.amountPaid;
            let exists = await this.account.find({}).sort({invInit:-1}).limit(1);
            let sn;
            if(exists[0]) {
              sn = exists[0].invInit + 1
            }else {
              sn = 1;
            }
            let init = 'INV';
            let invoiceNumber = padLeft(sn, 6, "");
            reciept.invoiceNo = init+invoiceNumber;
            reciept.invInit = sn;
            
            let sales = await this.salesRequisition.findById(reciept.salesReq)
            if(sales){
                sales.invoice_id = reciept._id;
                await sales.save();
            }
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
            page:query.page,
            limit:query.limit,
            populate:[
                { path:'preparedBy', model:'User' },
                { path:'salesReq', model:"sales-requisition" }
            ],
            sort:{createdAt: -1}
          }
          let q = {
            branch:user.branch
          }
          let or=[];
          if(search) {
            or.push({invoiceNo: new RegExp(search, 'gi')});
          }
          if(or.length > 0) {
            //@ts-ignore
            q = {...q, $or:or}
          }
          //@ts-ignore
            const invoices = await this.account.paginate(q,options);
            return Promise.resolve(invoices);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async viewInvoiceDetails(invoiceId:string):Promise<RecieptInterface|undefined>{
        try{
            const invoice = await this.account.findById(invoiceId).populate([
                    { path:'preparedBy', model:'User'},
                    {path:'salesReq', model:"sales-requisition"}
                ]);
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
