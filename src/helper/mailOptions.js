require("dotenv").config();

// default email verification mail template
exports.defaultEmailVerificationTemplate = (data, verificationLink) => {
    return {
        to: data.EmailId,
        from: process.env.GMAIL_USER,
        subject: `[Social Hive] Verify your Email`,
        html: `<p>Hello, ${data.FirstName} ${data.LastName}</p></br>
               <p>Verify your email address by clicking the link given below.</p></br>
               <center><h3><a href='${verificationLink}' target=_blank>${verificationLink}</a></h3></center></br>
               <p>This link is valid for <b>6 hours</b>.</p></br>
               <p>Please do NOT share this link or email with anyone.</p></br>
               <p>Thank you.</p></br>
               <h3>Social Hive</h3>`
    }
}

// otp email tempalte
exports.otpEmailTemplate = (data, verificationLink) => {
    return {
        to: data.EmailId,
        from: process.env.GMAIL_USER,
        subject: `${data.otp} is your otp to reset password`,
        html: `<p>Hello, ${data.FirstName} ${data.LastName}</p></br>
               <p>OTP to reset your password is given below.</p></br>
               <center><h3>${data.otp}</h3></center>
               <p>This OTP is valid for <b>5 minutes</b>.</p></br>
               <p>Please do NOT share this OTP with anyone.</p></br>
               <p>Thank you.</p></br>
               <h3>Social Hive</h3>`
    }
}