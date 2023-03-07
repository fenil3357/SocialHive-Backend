const authModel = require("../models/auth.model");
const emailSender = require('../helper/mailHelper');
const mailOptions = require('../helper/mailOptions');
const jwt = require("jsonwebtoken");
const { sign } = require("jsonwebtoken");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
require('dotenv').config();
const otpGenerator = require('../helper/otpGenerator');
const sendCustomEmailService = require("../helper/mailHelper");

// sign up service
exports.signUpService = (req, res) => {
  const body = req.body;

  // not all parameters provided
  if (body.hasOwnProperty('UserName') == false || body.hasOwnProperty('EmailId') == false || body.hasOwnProperty('FirstName') == false || body.hasOwnProperty('LastName') == false || body.hasOwnProperty('password') == false) {
    res.json({
      Error: "Please provide all fields",
      ERR_CODE: "BAD_FIELD_ERR",
      status: false
    })
    return;
  }

  // Username minimum length
  if (body.UserName.length < 6) {
    res.json({
      Error: "Username must be atleast 6 characters long",
      ERR_CODE: "USER_SHORT",
      status: false
    })
    return;
  }

  // Password minimum length
  if (body.password.length < 6) {
    res.json({
      Error: "Password must be atleast 6 characters long",
      ERR_CODE: "PASS_SHORT",
      status: false
    })
    return;
  }

  // check if email already in use
  const EmailId = body.EmailId;

  authModel.getUserByEmailModel(EmailId, (err, user) => {
    if (err) {
      res.json({
        Error: "Something went wrong, Please try again",
        ERR_CODE: "DB_ERROR",
        status: false,
      });
    } else {
      // email exists and verified
      if ((user[0].length != 0 && user[0].length != "") && user[0][0].IsEmailVerified == 1) {
        res.json({
          Error: "Email already in use!",
          ERR_CODE: "EMAIL_EXISTS",
          status: false,
        });
      } else {
        // check if username is taken
        const UserName = body.UserName;

        authModel.getUserByUserNameModel(UserName, (err, user) => {
          if (err) {
            res.json({
              Error: "Something went wrong, Please try again",
              ERR_CODE: "DB_ERROR",
              status: false,
            });
          } else {
            // user name already exists
            if (user[0].length != 0 && user[0].length != "") {
              res.json({
                Error: "User name is already taken",
                ERR_CODE: "USERNAME_TAKEN",
                status: false,
              });
            } else {
              // sign up process

              // create jwt to verify email 
              var email_verification_token = jwt.sign(
                { email: body.EmailId },
                process.env.EMAIL_VERIFICATION_SECRET,
                { expiresIn: "6h" }
              );

              // email verification link
              const email_verification_link = `http://localhost:5000/api/auth/verify/${email_verification_token}`;

              // create mail template for default verification email
              const verificationMailOption = mailOptions.defaultEmailVerificationTemplate(body, email_verification_link);

              // send verification email
              emailSender(verificationMailOption, (mail_error, result) => {
                if (mail_error) {
                  res.json({
                    Error: "Please provide a valid email adrress",
                    ERR_CODE: "MAIL_ERR",
                    status: false
                  })
                }
                else {
                  // if verification mail sent properly then store users details in database
                  authModel.signUpModel(body, (err, result) => {
                    if (err) {
                      res.json({
                        Error: "Something went wrong, Please try again",
                        ERR_CODE: "DB_ERROR",
                        status: false,
                      });
                    } else {
                      res.json({
                        Msg: "Sign up complete! Please confirm your email",
                        status: true
                      })
                    }
                  });
                }
              })
            }
          }
        });
      }
    }
  });
};

// log in service
exports.logInService = (req, res) => {
  const body = req.body;

  // not all parameters provided
  if (body.hasOwnProperty('UserName') == false || body.hasOwnProperty('password') == false) {
    res.json({
      Error: "Please provide all fields",
      ERR_CODE: "BAD_FIELD_ERR",
      status: false
    })
    return;
  }

  authModel.getUserByUserNameModel(body.UserName, (err, user) => {
    if (err) {
      res.json({
        Error: err,
        ERR_CODE: "DB_ERROR",
        status: false
      })
    }
    else {
      // if user does not exists with given username
      if (user[0].length == "" || user[0].length == 0) {
        res.json({
          Error: "User does not exists",
          ERR_CODE: "USER_DN_EXISTS",
          status: false
        })
      }
      else {
        // check if email is verified or not
        if (user[0][0].IsEmailVerified == 0) {
          res.json({
            Error: "Your Email is not verified",
            ERR_CODE: "EMAIL_NOT_VERIFIED",
            status: false
          })
        }
        else {
          // check if password is valid or not
          const result = compareSync(body.password, user[0][0].Password);

          // valid password
          if (result) {
            // create json web token
            const token = sign({ user: user }, process.env.USER_SECRET, {
              expiresIn: "30day",
            });

            // send token to user
            res.json({
              Msg: "Log in successfull!",
              token: token,
              status: true
            })

            // store log in session
            const UserId = user[0][0].UserId;

            const logInData = {
              UserName: body.UserName,
              UserId: UserId,
              ip: req.socket.remoteAddress
            }

            authModel.logInSessionModel(logInData, (err, result) => {
            });

          }
          // invalid password
          else {
            res.json({
              Error: "Invalid password",
              ERR_CODE: "INV_PASS",
              status: false
            })
          }
        }
      }
    }
  })
}

// Verify Email through link service
exports.verfiyEmailViaLinkService = (req, res) => {
  const jwtToken = req.params.token;

  // invalid link/token
  if (req.params.hasOwnProperty('token') == false || jwtToken == undefined || jwtToken == "" || jwtToken == null) {
    res.json({
      Error: "Invalid Token/Link",
      ERR_CODE: "INV_URL",
      status: false
    })
    return;
  }

  jwt.verify(jwtToken, process.env.EMAIL_VERIFICATION_SECRET, (err, data) => {
    if (err) {
      res.json({
        Error: err,
        ERR_CODE: "JWT_ERR",
        status: false
      })
    }
    else {
      const email = data.email;
      authModel.updateVerificationStatusModel(email, (error, user) => {
        if (error) {
          res.json({
            Error: error,
            ERR_CODE: "DB_ERROR",
            status: false
          })
        }
        else {
          res.json({
            Msg: "Email verified successfully!",
            status: true
          })
        }
      })
    }
  })
}

// Forgot password service (send email + save otp)
exports.forgotPasswordService = (req, res) => {
  const body = req.body;

  // Username or email not provided
  if (body.hasOwnProperty('user_name_email') == false) {
    res.json({
      Error: "Please provide username or email",
      ERR_CODE: "BAD_FIELD_ERR",
      status: false
    })
    return;
  }

  const user_name_email = body.user_name_email;

  authModel.getUserByUserNameEmailModel(user_name_email, (err, user) => {
    if (err) {
      res.json({
        Error: err,
        ERR_CODE: "DB_ERROR",
        status: false
      })
      return;
    }
    else {
      // if there is no such user exists
      if (user[0].length == 0 || user[0].length == "") {
        res.json({
          Error: "User does not exists",
          ERR_CODE: "USER_DN_EXISTS",
          status: false
        })
        return;
      }
      else {
        // send otp via email
        const otp = otpGenerator(6);  // OTP of length 6

        // user data

        const userObj = user[0][0];

        const userData = {
          UserName: userObj.UserName,
          EmailId: userObj.EmailId,
          otp: otp,
          FirstName: userObj.FirstName,
          LastName: userObj.LastName
        }

        // OTP email template
        const otpEmailOptions = mailOptions.otpEmailTemplate(userData);

        // send OTP email
        emailSender(otpEmailOptions, (mail_err, result) => {
          if (mail_err) {
            res.json({
              Error: mail_err,
              ERR_CODE: "MAIL_ERR",
              status: false
            })
            return;
          }
          else {
            // store OTP to user data
            authModel.saveUserOTPModel(userData, (db_err, db_res) => {
              if (db_err) {
                res.json({
                  Error: db_err,
                  ERR_CODE: "DB_ERROR",
                  status: false
                })
                return;
              }
              else {
                res.json({
                  Msg: "OTP has been sent to your email",
                  stauts: true
                })
              }
            })
          }
        })
      }
    }
  })
}

// Check OTP service
exports.checkOTPService = (req, res) => {
  const body = req.body;

  // bad field
  if (body.hasOwnProperty('UserName') == false || body.hasOwnProperty('otp') == false) {
    res.json({
      Error: "Please provide username and otp",
      ERR_CODE: "BAD_FIELD_ERR",
      status: false
    })
    return;
  }

  authModel.checkOTPModel(body, (err, data) => {
    if (err) {
      res.json({
        Error: err,
        ERR_CODE: "DB_ERROR",
        status: false
      })
      return;
    }
    else {
      // OTP expired or does not exists
      if (data[0].length == 0 || data[0].length == "") {
        res.json({
          Error: "Your OTP is expired",
          ERR_CODE: "OTP_EXP",
          status: false
        })
        return;
      }
      else {
        // wrong OTP
        if (data[0][0].otp != body.otp) {
          res.json({
            Error: "Wrong OTP",
            ERR_CODE: "WRONG_OTP",
            status: false
          })
          return;
        }
        else {
          res.json({
            Msg: "OTP verified",
            status: true
          })
        }
      }
    }
  })
}

// Reset password service
exports.resetPasswordService = (req, res) => {
  const body = req.body;

  // bad field error
  if (body.hasOwnProperty('UserName') == false || body.hasOwnProperty('password') == false || body.hasOwnProperty('otp') == false) {
    res.json({
      Error: "Please provide all fields",
      ERR_CODE: "BAD_FIELD_ERR",
      status: false
    })
    return;
  }

  const Password = body.password;
  
  // Password minimum length
  if (Password < 6) {
    res.json({
      Error: "Password must be atleast 6 characters long",
      ERR_CODE: "PASS_SHORT",
      status: false
    })
    return;
  }

  // check OTP
  authModel.checkOTPModel(body, (err, data) => {
    if (err) {
      res.json({
        Error: err,
        ERR_CODE: "DB_ERROR",
        status: false
      })
      return;
    }
    else {
      // OTP expired or does not exists
      if (data[0].length == 0 || data[0].length == "") {
        res.json({
          Error: "Your OTP is expired",
          ERR_CODE: "OTP_EXP",
          status: false
        })
        return;
      }
      else {
        // wrong OTP
        if (data[0][0].otp != body.otp) {
          res.json({
            Error: "Wrong OTP",
            ERR_CODE: "WRONG_OTP",
            status: false
          })
          return;
        }
        else {
          // update password
          authModel.resetPasswordModel(body, (err, result) => {
            if (err) {
              res.json({
                Error: err,
                ERR_CODE: "DB_ERROR",
                status: false
              })
              return;
            }
            else {
              res.json({
                Msg: "Your password is now changed",
                status: true
              })
            }
          })
        }
      }
    }
  })
}