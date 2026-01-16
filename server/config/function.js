/* This all of are helper function */
const userModel = require("../models/users");

exports.toTitleCase = function (str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

exports.validateEmail = function (mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  } else {
    return false;
  }
};

exports.emailCheckInDatabase = async function (email) {
  try {
    // FIX: In Mongoose 8.x, findOne() returns a promise directly
    const user = await userModel.findOne({ email: email });
    return !!user; // Return true if user exists, false if null
  } catch (err) {
    console.error("Error checking email:", err);
    return false; // Return false on error
  }
};

exports.phoneNumberCheckInDatabase = async function (phoneNumber) {
  try {
    // FIX: In Mongoose 8.x, findOne() returns a promise directly  
    const user = await userModel.findOne({ phoneNumber: phoneNumber });
    return !!user; // Return true if user exists, false if null
  } catch (err) {
    console.error("Error checking phone number:", err);
    return false; // Return false on error
  }
};
