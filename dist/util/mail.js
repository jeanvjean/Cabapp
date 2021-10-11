"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("../modules/module");
const firebase = require('firebase-admin');
const node_mailjet_1 = require("node-mailjet");
const firebase_admin_1 = require("firebase-admin");
const path_1 = require("path");
const request_promise_1 = require("request-promise");
const resolve_template_1 = require("./resolve-template");
const static_1 = require("../configs/static");
const serviceAccount = require(path_1.join(__dirname, '../../asnl.json'));
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://asnl-1f533-default-rtdb.firebaseio.com"
});
/**
 * Handle all business logic that could happen in Index controller
 *
 * @category Modules
 */
class NotificationModule extends module_1.default {
    constructor() {
        super();
        this.privateKey = static_1.default.PRIVATE_SMTP;
        this.publicKey = static_1.default.PUBLIC_SMTP;
        this.senderName = static_1.default.SMTP_FROM_NAME;
        this.senderEmail = static_1.default.SMTP_FROM_EMAIL;
        this.mailJet = node_mailjet_1.connect(this.publicKey || '', this.privateKey || '');
        this.serverKey = static_1.default.FCM_SERVER_KEY;
        this.firebase = firebase_admin_1.messaging;
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
    sendMail(mail) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = {
                    From: {
                        Name: mail.company ? mail.company : this.senderName,
                        Email: this.senderEmail || 'service-noreply@power-invest.com'
                    },
                    Subject: mail.subject,
                    HTMLPart: mail.content,
                    To: [
                        {
                            Email: mail.email
                        }
                    ]
                };
                // if (mail.replyTo) {
                // 	message['ReplyTo'] = {
                // 		Email: mail.replyTo
                // 	}
                // }
                // if (mail.name) {
                // 	message.To[0]['Name'] = mail.name
                // }
                const response = yield this.mailJet
                    .post('send', { version: 'v3.1' })
                    .request({
                    Messages: [message]
                });
                console.log(response.body);
                return { success: true, data: response.body };
            }
            catch (error) {
                console.log(error);
                return { success: false, error };
            }
        });
    }
    testSendMail() {
        return __awaiter(this, void 0, void 0, function* () {
            let review = {
                email: "lambo@mailinator.com",
                code: "00290857348564",
                name: "Jonathan Larke",
                title: "Swerve this shit",
                description: "its prime time and am rick james"
            };
            const contents = yield resolve_template_1.getTemplate('invite-reviewer', {
                email: review.email,
                code: review.code,
                name: review.name,
                title: review.title,
                description: review.description
            });
            const mailLoad = {
                email: review.email,
                content: contents,
                subject: 'Hello Reviewer from Airsep.io',
            };
            yield this.sendMail(mailLoad);
        });
    }
    /**
     * Send a push notification to a user's token
     *
     * @param {Object|WebPush} payload
     *
     * @return {Promise<Object>}
     */
    push(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // Send a message to devices subscribed to the provided topic.
            try {
                let response = null;
                if (payload.user.token) {
                    const message = {
                        notification: {
                            title: payload.subject,
                            body: payload.content
                        },
                        to: payload.user.token
                    };
                    if (payload.data) {
                        message.data = payload.data;
                    }
                    response = yield request_promise_1.post({
                        uri: 'https://fcm.googleapis.com/fcm/send',
                        body: message,
                        json: true,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `key=${this.serverKey}`
                        }
                    });
                }
                yield this.saveMessageToFirebase(payload);
                return { success: true, data: response };
            }
            catch (error) {
                return { success: false, error };
            }
        });
    }
    saveMessageToFirebase(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (payload.user) {
                try {
                    const dbRef = firebase.database().ref(payload.user._id.toString());
                    const time = Date.now();
                    let rad = yield dbRef
                        .child("notifications")
                        .push({
                        title: payload.subject,
                        body: payload.content,
                        date: time
                    });
                    let red = yield dbRef
                        .child('newNotifications')
                        .transaction((counter) => (counter || 0) + 1);
                }
                catch (error) {
                    console.log(error);
                }
            }
        });
    }
    fetchData() {
        const db = firebase.database();
        const ref = db.ref('https://asnl-1f533-default-rtdb.firebaseio.com');
        ref.on('value', (snapshot) => {
            console.log(snapshot.val());
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
        });
    }
}
exports.default = NotificationModule;
//# sourceMappingURL=mail.js.map