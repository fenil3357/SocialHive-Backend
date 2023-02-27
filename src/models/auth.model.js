const dbConn = require("../../config/db.config");
const crypto = require("crypto");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");

// sign up model
exports.signUpModel = (data, result) => {
  const UserName = data.UserName;
  const EmailId = data.EmailId;
  const FirstName = data.FirstName;
  const LastName = data.LastName;
  var password = data.password;
  const UserId = crypto.randomUUID();

  const salt = genSaltSync(10);
  password = hashSync(password, salt);

  const sign_up_query = `CALL sign_up('${UserName}', '${EmailId}', '${FirstName}', '${LastName}', '${password}', '${UserId}');`;

  dbConn.query(sign_up_query, (err, res) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING SIGN UP MODEL QUERY :" + err);
      result(err);
    } else result(null, res);
  });
};

// Email existence model
exports.getUserByEmailModel = (EmailId, result) => {
  const mail_existence_query = `CALL get_user_by_email('${EmailId}');`;

  dbConn.query(mail_existence_query, (err, user) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING GET USER BY EMAIL  MODEL QUERY :" + err);
      result(err);
    } else result(null, user);
  });
};

// Get user by username model
exports.getUserByUserNameModel = (UserName, result) => {
  const user_name_existence_query = `CALL get_user_by_user_name('${UserName}');`;

  dbConn.query(user_name_existence_query, (err, user) => {
    if (err) {
      console.log(
        "ERROR WHILE EXECUTING GET USER BY USERNAME  MODEL QUERY :" + err
      );
      result(err);
    } else result(null, user);
  });
};

// Get user by username or email model
exports.getUserByUserNameEmailModel = (user_name_email, result) => {
  const user_name_email_query = `CALL get_user_by_user_name_email('${user_name_email}');`;

  dbConn.query(user_name_email_query, (err, user) => {
    if (err) {
      console.log(
        "ERROR WHILE EXECUTING GET USER BY USERNAME/EMAIL  MODEL QUERY :" + err
      );
      result(err);
    } else result(null, user);
  });
};


// log in session model
exports.logInSessionModel = (data, callBack) => {
  const UserName = data.UserName;
  const UserId = data.UserId;
  const logInId = crypto.randomUUID();
  const ip = data.ip;

  const login_session_query = `CALL add_login_session('${logInId}', '${UserId}', '${UserName}', '${ip}');`;

  dbConn.query(login_session_query, (err, res) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING LOGIN SESSION MODEL QUERY :" + err);
      callBack(err);
    }
    else callBack(null, res);
  })
}

// Update user email verification status model
exports.updateVerificationStatusModel = (email, callBack) => {
  const update_verification_query = `CALL update_verification_status('${email}');`;

  dbConn.query(update_verification_query, (err, data) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING UPDATE VERIFICATION STATUS MODEL :" + err);
      callBack(err);
    }
    else callBack(null, data);
  })
}

// Save user OTP model
exports.saveUserOTPModel = (data, callBack) => {
  const UserName = data.UserName;
  const EmailId = data.EmailId;
  const otp = data.otp;

  const save_user_otp_query = `CALL save_user_otp('${UserName}', '${EmailId}','${otp}');`;

  dbConn.query(save_user_otp_query, (err, res) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING SAVING USER OTP QUERY :" + err);
      callBack(err);
    }
    else callBack(null, res);
  })
}

// Check OTP Model
exports.checkOTPModel = (data, callBack) => {
  const UserName = data.UserName;

  const check_otp_query = `CALL check_otp('${UserName}');`;

  dbConn.query(check_otp_query, (err, res) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING CHECK OTP QUERY :" + err);
      callBack(err);
    }
    else callBack(null, res);
  })
}

// Reset Password Model
exports.resetPasswordModel = (data, callBack) => {
  let Password = data.password;
  const UserName = data.UserName;

  const salt = genSaltSync(10);
  Password = hashSync(Password, salt);

  const reset_pass_query = `CALL reset_password('${UserName}', '${Password}');`;

  dbConn.query(reset_pass_query, (err, res) => {
    if (err) {
      console.log("ERROR WHILE EXECUTING RESET PASSWORD QUERY :" + err);
      callBack(err);
    }
    else callBack(null, res);
  })
}