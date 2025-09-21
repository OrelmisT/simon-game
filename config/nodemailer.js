import config from "./config.js";
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service:"Gmail",
    auth:{
        user:config.NODE_MAILER_EMAIL,
        pass:config.NODE_MAILER_PASSWORD
    }
})


export default transporter