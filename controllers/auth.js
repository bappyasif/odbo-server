const passport = require("passport");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const { generatePassword, validatePassword, issueJWT, verifyJWT } = require("../utils/jwt");
const { createJwtAccessToken, createJwtRefreshToken, verifyAccessTokenVilidity, extractUserFromToken } = require("../configs/jwt");

const registerUser = [
    body("fullname", "fullname can not be left empty")
        .trim().isLength({ min: 1 }).escape(),
    body("email", "email can not be left empty")
        .trim().isLength({ min: 1 }).escape(),
    body("email", "email needs to be of email type")
        .trim().isEmail().escape(),
    body("password", "password can not be left empty")
        .trim().isLength({ min: 1 }).escape(),
    body("password", "password needs to be more than or equal to 4 characters")
        .trim().isLength({ min: 4 }).escape(),
    body("confirm", "confirm password needs to be more than or equal to 4 characters")
        .trim().isLength({ min: 4 }).escape(),
    body("confirm", "password and confirm password needs to be same")
        .exists().custom((val, { req }) => val === req.body.password),

    (req, res, next) => {
        let errors = validationResult(req);

        // generating hash and salt from user provided password, which will be checked when user tries to login with their password
        const getSaltAndHash = generatePassword(req.body.password);

        const salt = getSaltAndHash.salt;
        const hash = getSaltAndHash.hash;

        const data = {
            fullName: req.body.fullname,
            email: req.body.email,
            password: req.body.password,
            salt,
            hash,
            created: new Date().toISOString()
        }

        if (!errors.isEmpty()) {
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        // data sanitized and validated
        let newUser = new User(data)

        // let's check if this same email address is already been used or not
        User.findOne({ email: req.body.email })
            .then((result) => {
                if (result) {
                    // that email id already exists in database, lets response back user with this error message to try some other email address
                    res.status(402).json({ success: false, errors: [{ msg: "email id already exists" }] })
                } else {
                    // email id is not found in databse and safe to complete user registration process with this email address
                    newUser.save((err, user) => {
                        if (err) return next(err);

                        // issuing jwt token with our private key, so that out verfication with public key remains valid
                        const jwt = issueJWT(user);

                        // user is saved successfully, returning a response so that authentication token can be passed on to client browser
                        res.status(200).json({ success: true, user: user, token: jwt.token, expiresIn: jwt.expires })
                    })
                }
            }).catch(err => next(err))
    }
]

const loginUser = [
    body("email", "email can not be left empty")
        .trim().isLength({ min: 1 }).escape(),
    body("email", "email needs to be of email type")
        .trim().isEmail().escape(),
    body("password", "password can not be left empty")
        .trim().isLength({ min: 1 }).escape(),
    body("password", "password needs to be at least 4 characters long")
        .trim().isLength({ min: 4 }).escape(),

    (req, res, next) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        // lets check if that user actually exists with this given email id
        User.findOne({ email: req.body.email })
            .then(user => {
                if (user) {
                    // user is found with this email address, lets begin boarding user into our website with authentication and whole bits
                    // first let us check if given password matches (to do)

                    // checking user provided password along with hash and salt matched cryptographic token or not
                    const userValid = validatePassword(req.body.password, user.hash, user.salt)

                    if (userValid) {
                        // issuing jwt signed token for authentication
                        // const jwt = issueJWT(user);

                        const accessToken = createJwtAccessToken(user)
                        const refreshToken = createJwtRefreshToken(user);

                        // successfully verified and commencing user authentication with json web token
                        // returning response object with signed token for client to use as a valid user
                        // res.status(200).json({ success: true, user: user, userJwt: { token: jwt.token, expiresIn: jwt.expires } })

                        res.status(200).json({ success: true, user: user, userJwt: { token: accessToken, refreshToken: refreshToken } })

                    } else {
                        // if token does not match then we;re sending back a 401 error saying password does nto match
                        res.status(401).json({ success: false, errors: [{ msg: "password does not match" }] })
                    }
                } else {
                    res.status(402).json({ success: false, errors: [{ msg: "user is not found with this email address" }] })
                }
            }).catch(err => next(err))
    }
];

let loginWithOauthProvider = (req, res) => {
    res.status(200).json({ success: true })
}

let loginOauthProviderCallback = (req, res) => {
    // if user is not logged in we will be sending back 402 error otherwise 200
    if (req.user) {
        // extracting user object from req object which was done through passport
        res.status(200).json({ success: true, user: req.user })
    } else {
        res.status(402).json({ success: false, msg: "user not logged in" })
    }
}

const returnAuthenticatedUser = (req, res, next) => {
    if (req.user) {
        // issuing jwt signed token for authentication
        const jwt = issueJWT(req.user);

        res.status(200).json({ success: true, data: req.user, cookies: req.cookies, jwt: req?.jwt, userJwt: { token: jwt.token, expiresIn: jwt.expires } })
    } else {
        res.status(401).json({ success: false, msg: "user not logged in" })
    }
}

const authenticatedUserJwtVerification = (req, res, next) => {
    const refreshToken = req?.headers?.refreshtoken;
    const tokenParts = req?.headers?.authorization?.split(' ');

    console.log(req?.headers)

    // console.log(refreshToken, req.body)

    if (tokenParts) {
        const bearerText = tokenParts[0]
        const tokenString = tokenParts[1];

        // console.log(bearerText, tokenString, refreshToken, req.body)

        if (bearerText === "Bearer" && tokenString.match(/\S+\.\S+\.\S+/)) {
            try {
                // const verification = verifyJWT(tokenString)

                const verification = verifyAccessTokenVilidity(tokenString, refreshToken)
                req.jwt = verification;
                next();
            } catch (err) {
                console.log(err, "invalid token")
                res.status(401).json({ msg: "Unauthorized token" })
            }
        } else {
            res.status(401).json({ msg: "Unauthorized token" })
        }
    } else {
        res.status(401).json({ msg: "Undefined token" })
    }
}

const extractDataForAnAuthenticatedUser = (req, res, next) => {
    const test = extractUserFromToken(req.jwt)
    console.log(req.jwt, "req.jwt!!", test)

    if (req.jwt?.sub) {
        User.findOne({ _id: req.jwt.sub })
            .then(dataset => {
                // console.log(dataset, "dataset!!")
                res.status(201).json({ msg: "user data has been transported after JWT verficiation", user: dataset })
            }).catch(err => {
                console.log(err)
                return res.status(403).json({ msg: "response error!!" })
            })
    } else {
        res.status(401).json({ msg: "Undefined token" })
    }
}

const logoutUser = (req, res, next) => {
    req.logout();
    res.clearCookie("session")
    res.clearCookie("session.sig")
    res.status(200).json({ success: true, msg: "user logged out successfully", user: req.user })
}

module.exports = {
    loginUser,
    registerUser,
    loginWithOauthProvider,
    loginOauthProviderCallback,
    logoutUser,
    returnAuthenticatedUser,
    extractDataForAnAuthenticatedUser,
    authenticatedUserJwtVerification
}