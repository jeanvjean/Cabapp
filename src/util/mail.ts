import  Module  from '../modules/module';
const firebase = require('firebase-admin');
import {connect, Email} from 'node-mailjet'
import { messaging } from 'firebase-admin'
import {join} from 'path'
import {post} from 'request-promise'
import { getTemplate } from "./resolve-template";
import SecretKeys from '../configs/static';
import { ScanInterface } from '../models/scan';
import axios from 'axios';
import request = require('request');

const serviceAccount = require(join(
	__dirname,
	'../../asnl.json'
));

firebase.initializeApp(
	{
		credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://asnl-1f533-default-rtdb.firebaseio.com"
	}
);

export interface MessageOptions {
	data?: string
	notification: object
	to: string
}

export interface SubscriptionOPtion {
	token: string
	topic: string
}

export interface WebPush {
	subject: string
  content: string
  //@ts-ignore
	data?: messaging.DataMessagePayload
	icon?: string
	user?: any
}

export interface SendMailOption {
	email: string
	subject: string
	content: string
	replyTo?: string
    name?: string
    company?: string
}

interface NotificationPersistOption {
	user_id: number
	message: string
}

interface smsInterface {
  message?: string,
  to?:string
}

interface FormData {
  formId:ScanInterface['formId'],
  cylinders:ScanInterface['cylinders'],
  status: ScanInterface['status']
}

/**
 * Handle all business logic that could happen in Index controller
 *
 * @category Modules
 */
class NotificationModule extends Module {
	private privateKey?: string
	private publicKey?: string
	private senderName?: string
	private senderEmail?: string
	private mailJet?: any
	private serverKey?: string
	private firebase?: any
	constructor() {
		super()
		this.privateKey = SecretKeys.PRIVATE_SMTP
		this.publicKey = SecretKeys.PUBLIC_SMTP
		this.senderName = SecretKeys.SMTP_FROM_NAME
		this.senderEmail = SecretKeys.SMTP_FROM_EMAIL
		this.mailJet = connect(this.publicKey || '', this.privateKey || '');
		this.serverKey = SecretKeys.FCM_SERVER_KEY

		this.firebase = messaging
	}

	/**
	 * Send a mail notification to a specific email address
	 *
	 * @param {Object|SendMailOption} mail
	 *
	 * @throws {InvalidMailAddressException}
	 *
	 * @return {Promise<Object>}
	 */
	async sendMail(mail: SendMailOption): Promise<Record<string, unknown>> {
        try {
            const message: Email.SendParamsMessage = {
              From: {
                Name: mail.company?mail.company:this.senderName,
                Email: this.senderEmail || 'service-noreply@power-invest.com'
              },
              Subject: mail.subject,
              HTMLPart: mail.content,
              To: [
                {
                  Email: mail.email
                }
              ]
            }
            // if (mail.replyTo) {
            // 	message['ReplyTo'] = {
            // 		Email: mail.replyTo
            // 	}
            // }
            // if (mail.name) {
            // 	message.To[0]['Name'] = mail.name
            // }
          const response = await this.mailJet
            .post('send', {version: 'v3.1'})
            .request({
              Messages: [message]
            })
          console.log(response.body)
          return {success: true, data: response.body}
            } catch (error) {
                console.log(error)
          return {success: false, error}
        }
  }

    public async testSendMail(): Promise<void> {
        let review = {
            email: "lambo@mailinator.com",
            code: "00290857348564",
            name: "Jonathan Larke",
            title: "Swerve this shit",
            description: "its prime time and am rick james"
        }
        const contents = await getTemplate('invite-reviewer', {
            email: review.email,
            code: review.code,
            name: review.name,
            title: review.title,
            description: review.description
        })
        const mailLoad = {
            email: review.email,
            content: contents,
            subject: 'Hello Reviewer from Airsep.io',
        }
        await this.sendMail(mailLoad)
    }

	/**
	 * Send a push notification to a user's token
	 *
	 * @param {Object|WebPush} payload
	 *
	 * @return {Promise<Object>}
	 */
	async push(payload: WebPush): Promise<Record<string, unknown>> {
		// Send a message to devices subscribed to the provided topic.
        try {
            let response = null

            if (payload.user.token) {
                const message: MessageOptions = {
                    notification: {
                        title: payload.subject,
                        body: payload.content
                    },
                    to: payload.user.token
                }
                if (payload.data) {
                    message.data = payload.data
                }
                response = await post({
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: message,
                    json: true,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `key=${this.serverKey}`
                    }
                })
            }
			await this.saveMessageToFirebase(payload)
			return {success: true, data: response}
		} catch (error) {
			return {success: false, error}
		}
	}

    public async saveMessageToFirebase(payload: WebPush) {
		if (payload.user) {
            try {
                const dbRef = firebase.database().ref('messaging')
                const time = Date.now()
                let rad = await dbRef.child(payload.user._id.toString())
                let notRef = await rad.child('notification')
                .push({
                    title: payload.subject,
                    body: payload.content,
                    date: time
                })
		    	    let red = await rad.child('newNotifications').transaction((counter: number) => (counter || 0) + 1)
            } catch (error) {
                console.log(error)
            }
		}
	}

  public async saveFormToFirebase(payload: FormData) {
		if (payload.formId) {
            try {
                const dbRef = firebase.database().ref('forms')
                const formRef = await dbRef.child(payload.formId.toString());
                // const time = Date.now()
                let rad = await formRef.child('form')
                .set({
                    form_id: payload.formId,
                    cylinders:JSON.stringify(payload.cylinders),
                    status:payload.status
                });
		    	    // let red = await dbRef.child('newNotifications').transaction((counter: number) => (counter || 0) + 1)
            } catch (error) {
                console.log(error)
            }
		}
	}

  public async sendSms(payload:smsInterface) {
    try {
      let messagePayload = {
        messages: [
          {
            from: SecretKeys.INFOBIP_FROM,
            destinations: [
              { to: payload.to }
            ],
            text: payload.message
          }
        ]
      }
     let response = await axios.post(`${SecretKeys.INFOBIP_URL}sms/2/text/advanced`, messagePayload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `App ${SecretKeys.INFOBIP_API_KEY}`
          }
        }
      )
      console.log(response.data)
    } catch (error) {
      console.log({er:error})
    }
  }

  public async sendSMSTermii(payload:smsInterface){
    try {
      var data = {
        to:payload.to,
        from:"ASNL",
        sms:payload.message,
        type:"plain",
        api_key:SecretKeys.TERMII_API_KEY,
        channel:"generic",
        //  "media": {
        //     "url": "https://media.example.com/file",
        //     "caption": "your media file"
        //   }   
      };
      var options = {
          'method': 'POST',
          'url': 'https://api.ng.termii.com/api/sms/send',
          'headers': {
            'Content-Type': ['application/json', 'application/json']
          },
          body: JSON.stringify(data)
      };
        request(options, function (error, response) { 
          if (error) throw new Error(error);
            console.log(response.body);
        });
    } catch (error) {
      console.log(error)
    }
  }

  public fetchData(){
    const db = firebase.database();
    const ref = db.ref('https://asnl-1f533-default-rtdb.firebaseio.com');
    ref.on('value', (snapshot:any) => {
      console.log(snapshot.val());
    }, (errorObject:Error) => {
      console.log('The read failed: ' + errorObject.name);
    });
  }
}

export default NotificationModule
