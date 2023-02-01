const nodemailer = require("nodemailer");

const etherialEmailClientTransporter = (user, pass) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        // port: 587,
        port: 465,
        // secure: false, // true for 465, false for other ports
        secure: true, // true for 465, false for other ports
        auth: {
            user: "odbo.live@gmail.com",
            pass: "OdBo_LiVe"
        }
    })

    console.log("from transporter")

    return transporter;
}

const emailOptions = (toAddress, otpCode, fromAddress) => {
    const options = {
        // from: `${fromAddress}`,
        from: `OdBo <odbo.live@gmail.com>`,
        to: toAddress,
        subject: "Otp Passcode",
        text: `Your OTP Passcode Is : ${otpCode}`,
        html: `<h2>Your OTP Passcode Is : <em>${otpCode}</em> </h2>`
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