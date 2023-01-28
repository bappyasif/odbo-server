const passport = require("passport");
const express = require("express");
const { registerUser, loginUser, logoutUser, returnAuthenticatedUser, loginWithOauthProvider, extractDataForAnAuthenticatedUser, authenticatedUserJwtVerification, extractUserFromValidToken } = require("../controllers/auth");
const authRoutes = express();

// const baseUrlForAuth = "http://localhost:3001"

const baseUrlForAuth = "https://odbo-live.vercel.app"

let isAuthenticated = (req, res, next) => {
    if (req.user || req?.session?.passport?.user || req?.jwt) {
        console.log("user authenticated!!")
        next()
    } else {
        console.log("authentication error")
        // next()
        return res.status(401).json({success: false, data: [], msg: "not authenticated"})
    }
}

authRoutes.post("/register", registerUser)
authRoutes.post("/login", loginUser)

authRoutes.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent"
}))
authRoutes.get("/auth/google/redirect", passport.authenticate("google", {
    failureMessage: "Login error",
    failureRedirect: `${baseUrlForAuth}/login`,
    successRedirect: `${baseUrlForAuth}/login/success`
}))

authRoutes.get("/auth/facebook", passport.authenticate("facebook", { scope : ['email', "public_profile"]}))
authRoutes.get("/auth/facebook/redirect", passport.authenticate("facebook", {
    failureMessage: "Login error",
    failureRedirect: `${baseUrlForAuth}/login`,
    successRedirect: `${baseUrlForAuth}/login/success`
}))

authRoutes.get('/auth/github',passport.authenticate('github',  { scope: [ 'user:email' ] }));
authRoutes.get('/auth/github/redirect', passport.authenticate('github', { 
    failureMessage: "Login error",
    failureRedirect: `${baseUrlForAuth}/login`,
    successRedirect: `${baseUrlForAuth}/login/success`
}));

authRoutes.get('/auth/twitter',passport.authenticate('twitter'));
authRoutes.get('/auth/twitter/redirect', passport.authenticate('twitter', { 
    failureMessage: "Login error",
    failureRedirect: `${baseUrlForAuth}/login`,
    successRedirect: `${baseUrlForAuth}/login/success`
}));

authRoutes.get("/login/success", isAuthenticated, returnAuthenticatedUser)
// authRoutes.get("/login/success", returnAuthenticatedUser)

authRoutes.get("/logout", isAuthenticated, logoutUser)
// authRoutes.get("/logout", logoutUser)

authRoutes.get("/protected", authenticatedUserJwtVerification, extractDataForAnAuthenticatedUser)

authRoutes.get("/valid-user", extractUserFromValidToken)

module.exports = {
    authRoutes,
    isAuthenticated
}