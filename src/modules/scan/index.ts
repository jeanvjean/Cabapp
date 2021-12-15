import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ScanInterface, scanStatus } from '../../models/scan';
import Module, { QueryInterface } from "../module";
import Notify from '../../util/mail';
import { RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { padLeft } from "../../util/token";

interface scanPropInterface {
    scan: Model<ScanInterface>
    cylinder:Model<RegisteredCylinderInterface>
}

interface ScanInput {
    barcode: string,
    formId:string
}

interface UpdateScan {
    formId:string,
    cylinders:ScanInterface['cylinders']
}

class Scan extends Module {
    private scan:Model<ScanInterface>
    private cylinder:Model<RegisteredCylinderInterface>

    constructor(props:scanPropInterface) {
        super(),
        this.scan = props.scan
        this.cylinder = props.cylinder
    }

    public async ScanCylinder(data:ScanInput):Promise<ScanInterface | undefined> {
        try {
            if(!data.barcode) {
                throw new BadInputFormatException('a barcode scan is needed')
            }

            if(!data.formId) {
                throw new BadInputFormatException('formId is needed')
            }
            let found = await this.scan.findOne({formId: data.formId});
                if(!found) {
                    throw new BadInputFormatException('no form with this formId found')
                }
                // console.log(data.barcode);
                let cyl = await this.cylinder.findOne({barcode: data.barcode})
                // console.log(cyl)
                if(!cyl) {
                    throw new BadInputFormatException('cylinder info not found');
                }
                let m = found.cylinders.map(doc=> doc.barcode)
                if(m.includes(data.barcode)) {
                    throw new BadInputFormatException('this cylinder has been scanned')
                }
                found.cylinders.push({
                    cylinderNumber: cyl.cylinderNumber,
                    assignedNumber:cyl.assignedNumber,
                    barcode:cyl.barcode
                });
                await found.save();
                await new Notify().saveFormToFirebase({
                    formId:found.formId,
                    cylinders:found.cylinders,
                    status: found.status
                });
                return Promise.resolve(found);
        } catch (e) {
            this.handleException(e);
        }
    }

    public async updateCyliderScan(data:UpdateScan):Promise<ScanInterface|undefined>{
        try {
            let {cylinders, formId } = data;
            let scan = await this.scan.findOne({formId});
            if(!scan) {
                throw new BadInputFormatException('form not found');
            }
            let saveCyl = scan.cylinders;
            for(let cylinder of cylinders) {
                let m = scan.cylinders.map(doc=> doc.barcode)
                if(!m.includes(cylinder.barcode)) {
                    saveCyl.push(cylinder)
                }
            }
            // let updated = await scan.update({cylinders:saveCyl});
            scan.cylinders = saveCyl;
            await new Notify().saveFormToFirebase({
                formId:scan.formId,
                cylinders:scan.cylinders,
                status: scan.status
            });
            await scan.save()
            return Promise.resolve(scan);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchScans(query:QueryInterface):Promise<ScanInterface[]|undefined> {
        try {
            let { search, page, limit, cylinderNumber, assignedNumber, barcode, status } = query;
            let options = {
                page:page || 1,
                limit:limit || 10
            }
            let q = {}
            let or = []
            if(search) {
                or.push({formId: new RegExp(search, 'gi')});
            }
            if(cylinderNumber) {
                //@ts-ignore
                q = {...q, 'cylinders.cylinderNumber': cylinderNumber}
            }
            if(assignedNumber) {
                //@ts-ignore
                q = {...q, 'cylinders.assignedNumber': assignedNumber}
            }
            if(barcode) {
                //@ts-ignore
                q = {...q, 'cylinders.barcode': barcode}
            }
            if(status) {
                //@ts-ignore
                q = {...q, status: status}
            }
            if(or.length > 0) {
                //@ts-ignore
                q = {...q, $or:or}
            }
            //@ts-ignore
            let scan = await this.scan.paginate(q, options);
            return Promise.resolve(scan)
        } catch (e) {
            this.handleException(e)
        }
    }

    public async scanInfo(formId:string):Promise<ScanInterface|undefined>{
        try {
            const scan = await this.scan.findOne({formId: formId});
            if(!scan) {
                throw new BadInputFormatException('scan information not found')
            }
            return Promise.resolve(scan);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async complete(formId:string):Promise<any>{
        try {
            let scan = await this.scan.findOne({formId});
            if(!scan) {
                throw new BadInputFormatException('scan information not found')
            }
            scan.status = scanStatus.COMPLETE;
            await new Notify().saveFormToFirebase({
                formId:scan.formId,
                cylinders:scan.cylinders,
                status: scan.status
            });
            await scan.save();
            return Promise.resolve({
                scan,
                message:'scan completed'
            });
        } catch (e) {
            this.handleException(e)
        }
    }

    public async initiateScan() :Promise<ScanInterface|undefined>{
        try {
            let form = new this.scan()
            let oldScan = await this.scan.find({}).sort({initNum:-1}).limit(1)
            let formId;
            if(oldScan[0]) {
                formId = oldScan[0].initNum + 1;
            }else {
                formId = 1
            }
            
            form.formId = padLeft(formId, 6, '');
            form.initNum = formId;
            await form.save();
            await new Notify().saveFormToFirebase({
                formId:form.formId,
                cylinders:form.cylinders,
                status: form.status
            });
            return Promise.resolve(form);
        } catch (e) {
            this.handleException(e);
        }
    }
}

export default Scan;