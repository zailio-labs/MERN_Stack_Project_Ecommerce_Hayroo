const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const userModel = require("../models/users");

exports.loginCheck = (req, res, next) => {
  try {
    let token = req.headers.token;
    
    if (!token) {
      return res.json({ error: "No token provided" });
    }
    
    token = token.replace("Bearer ", "");
    const decode = jwt.verify(token, JWT_SECRET);
    req.userDetails = decode;
    next();
  } catch (err) {
    return res.json({ error: "You must be logged in" });
  }
};

exports.isAuth = (req, res, next) => {
  let { loggedInUserId } = req.body;
  
  if (!req.userDetails || !req.userDetails._id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (!loggedInUserId || loggedInUserId != req.userDetails._id) {
    return res.status(403).json({ error: "You are not authenticated" });
  }
  
  next();
};

exports.isAdmin = async (req, res, next) => {
  try {
    let reqUser = await userModel.findById(req.body.loggedInUserId);
    
    if (!reqUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // If user role 0 that's mean not admin it's customer
    if (reqUser.userRole === 0) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
