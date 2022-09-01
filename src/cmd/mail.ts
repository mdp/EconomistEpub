var nodemailer = require('nodemailer');

// Create the transporter with the required configuration for Outlook
// change the user and pass !
var transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: process.env.SMTP_PORT || 587, // port for secure SMTP
    tls: {
       ciphers:'SSLv3'
    },
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// setup e-mail data, even with unicode symbols
// send mail with defined transport object

export const mail = async (epubFile: Buffer, recipients: string)=> {
    var mailOptions = {
        from: process.env.SMTP_SENDER,
        to: recipients,
        subject: `Latest Economist in Kindle Format - ${new Date().toString()}`,
        text: 'Latest Economist Attached',
        attachments: [
            {
                filename: `economist-${Date.now()}.epub`,
                content: epubFile,
            },
        ]
    };
    try {
        const info = await transporter.sendMail(mailOptions)
        console.log('Message sent: ' + info.response);
    } catch (e) {
        console.log('Error sending: ', e);

    }
}
