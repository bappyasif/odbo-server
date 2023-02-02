const nodemailer = require("nodemailer");

const ACCESS_TOKEN_NODE_MAILER = "ya29.a0AVvZVspy45W7S1DreyZ606AZPReELV17Ka-ADP7Bak2NRkrMI5S1f6kyDbK38ac1s1kSb9WSv7Yd-D-0zF5YviETs8ziTC7aZuR5OXMZRTtz2WcEPUUNrzqOMS-eVgWyhAXmUx0HLrSfW1QFHjB7FvKjlu2BaCgYKAe8SARISFQGbdwaIPKjtebCLh0welEbr8TcL9Q0163";

const etherialEmailClientTransporter = (user, pass) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        // host: "gmail",
        auth: {
            type: "oauth2",
            user: process.env.GMAIL_ID,
            pass: process.env.GMAIL_PASSWORD,
            clientId: process.env.NODEMAILER_OAUTH_CLIENT_ID,
            clientSecret: process.env.NODEMAILER_OAUTH_CLIENT_SECRET,
            refreshToken: process.env.NODEMAILER_OAUTH_REFRESH_TOKEN
        }
    })

    // console.log("from transporter")

    return transporter;
}

const emailOptions = (toAddress, otpCode, fromAddress) => {
    const options = {
        // from: `${fromAddress}`,
        // from: `OdBo <odbo.live@gmail.com>`, // whichever account is authenticated gmail will use that address as from by default
        to: toAddress,
        subject: "Otp Passcode For OdBo",
        text: `Your OTP Passcode Is : ${otpCode}`,
        html: `<h2>Your OTP Passcode Is : <em>${otpCode}</em> </h2> \n\n <b>This OTP Is Valid For Next 15 Minutes Only</b>`
    }
    console.log("email options!!", options)
    return options
}

const etherialEmailClientAgent = (toAddress, otpCode) => {
    return nodemailer.createTestAccount()
        .then(testAccount => {
            const user = testAccount.user;
            const pass = testAccount.pass;

            const transporter = etherialEmailClientTransporter(user, pass);

            console.log(user, pass, "test!!")

            transporter.verify((err, success) => {
                if(err) {
                    console.log("transporter is not ready", err)
                    // return false
                } else {
                    console.log("server ready", success)
                }
            })

            return transporter.sendMail(emailOptions(toAddress, otpCode, user))
                .then(info => {
                    console.log("sent message url preview", nodemailer.getTestMessageUrl(info))
                    return info;
                    // console.log("message sent", info.messageId)
                    // console.log("sent message url preview", nodemailer.getTestMessageUrl(info))
                }).catch(err => console.log("send email has failed", err))
        }).catch(err => console.log("test account create failed", err))
}

module.exports = {
    etherialEmailClientAgent
}

/**
 * 
 * 
 const etherialEmailClientTransporter = (user, pass) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        // host: "gmail",
        // port: 587,
        port: 465,
        // secure: false, // true for 465, false for other ports
        secure: true, // true for 465, false for other ports
        auth: {
            user: "odbo.live@gmail.com",
            pass: "*************"
        }
    })

    console.log("from transporter")

    return transporter;
}
 * 
 * 
 const etherialEmailClientTransporter = (user, pass) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: user,
            pass: pass
        }
    })

    console.log("from transporter")

    return transporter;
}
 */