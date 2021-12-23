

class Secret {
  static NODE_ENV="development"
  static PORT="3100"

  //[Mongo]
  static MONGODB_URI="mongodb+srv://tech:Wittercell@development.8h65w.mongodb.net/asnlretryWrites=true&w=majority"
  static PUBLIC_SMTP='56c4e79aa88d87130939928a0c28f30d'
  static PRIVATE_SMTP='53e7d95532c54eae01bba10822c7e456'
  static SMTP_FROM_EMAIL='maranathatolulope@gmail.com'
  static SMTP_FROM_NAME='gmail'
  static CLOUDINARY_KEY = "227697655458693"
  static CLOUDINARY_SECRET="iMeFPISULshzgunCBP-cpdOO6kk"
  static CLOUDINARY_NAME="dorz7hgqx"
  static FCM_SERVER_KEY = ''

  static FRONTEND_URL=`https://asnl-web.netlify.app`

  static TWILIO_ACCOUNT_SID = `ACc4c4f04c47d9bf9ace138f33f3a5eefe`
  static TWILIO_AUTH_TOKEN = `b678a088cf7f14609dc6e95ba2831380`
  static SMS_SENDER = `+2349066263759`

  static INFOBIP_API_KEY = 'cb3822996471ea51d67161feeb83b603-70589608-b434-4c8a-861b-178f84e8e2f2'
  static INFOBIP_URL = 'https://891g43.api.infobip.com/'
  static INFOBIP_FROM = 'ASNL'

  static TERMII_API_KEY = 'TLVxopTZsxPruXiozn7hZWmcfnbxRwCIoo0mnPbGZ6CAsdjl1IGvAs7CkbX8fN'
  static TERMII_SECRET = 'tsk_1peh60226f4fdf8a019421tgb9'
  static TERMII_URL = 'https://api.ng.termii.com/api/sms/number/send'
}

export default Secret
