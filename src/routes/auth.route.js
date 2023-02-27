const authService = require('../services/auth.service')

module.exports = (router) => {
    // sign up
    router.post('/auth/signup', authService.signUpService);

    // log in
    router.post('/auth/login', authService.logInService);

    // verify email using link
    router.get('/auth/verify/:token', authService.verfiyEmailViaLinkService);

    // forgot password
    router.post('/auth/forgot_password', authService.forgotPasswordService);

    // check OTP
    router.post('/auth/check_otp', authService.checkOTPService);

    // reset password
    router.post('/auth/reset_password', authService.resetPasswordService);
}