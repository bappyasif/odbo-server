const dotEnv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const MongoSession = require("connect-mongodb-session")(session)
const passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("./model/user");

// const REDIRECT_BASE_URL = "http://localhost:4000"
// const CLIENT_BASE_URL = "http://localhost:3000"

const REDIRECT_BASE_URL = "https://busy-lime-dolphin-hem.cyclic.app"
const CLIENT_BASE_URL = "https://odbo-live.vercel.app"

dotEnv.config();

const app = express();

mongoose.connect(process.env.DB_STR, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("database conected")).catch(err => console.log("database error!!", err));

const store = new MongoSession({
    uri: process.env.DB_STR,
    collection: "userSessions"
});

// middlewares
app.use(express.json())

app.use(cors({
    origin: CLIENT_BASE_URL,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
}))

app.set("trust proxy", 1);

app.use(session({
    store,
    name: "sessionID",
    saveUninitialized: true,
    resave: false,
    secret: process.env.SESSION_SECRET_KEYS,
    cookie: {
        // when running from local host, it doesnt have any ssl protocol, so both secure and samesite origin actually makes cookies attachment requests invalid
        // sameSite: "none",
        secure: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

// app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session()); // app.use(passport.authenticate("session")) equivalent

passport.serializeUser((user, done) => {
    console.log(user.profileId, "from serializer")
    done(null, user.profileId)
})

passport.deserializeUser((profileId, done) => {
    console.log(profileId, "deserialize")
    User.findOne({ profileId: profileId }, (err, user) => {
        if (err) return done(err, null)
        done(null, user)
        console.log(user, "deserializer cb")
    })
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${REDIRECT_BASE_URL}/auth/google/callback`
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOne({ profileId: profile.id }, (err, user) => {
            if (err) return cb(err, null)
            if (user) {
                console.log("user found!! already existing!!")
                return cb(null, user)
            } else {
                console.log("create new")
                const newUser = new User({
                    name: profile.displayName,
                    profileId: profile.id
                });

                newUser.save().then(createdUser => {
                    console.log("created User", createdUser)
                    return cb(null, user)
                }).catch(err => {
                    console.log("create user operation has thrown error")
                    cb(err, null)
                })
            }
        })
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: true }),
    function (req, res) {
        // Successful authentication, redirect home.
        console.log(req.user, "authenticated!!")
        req.session.userNew = req.user;
        res.redirect(CLIENT_BASE_URL);
    });

const isAuth = (req, res, next) => {
    console.log(req.sessionID, "!!", req.cookies, req.signedCookies, req.session.cookie, req.session.passport, req.session?.newUser)
    if (req.user || req.session?.newUser) {
        next()
    } else {
        res.status(401).json({ msg: "authentication failed!!" })
        // return res.redirect(`${CLIENT_BASE_URL}/login`)
    }
}

app.get("/login/success", isAuth, (req, res) => {
    res.status(200).json({ msg: "successful authentication", user: req.user || req.session?.newUser})
})

app.get("/logout", (req, res) => {
    if (req.user) {
        req.logOut(err => {
            if (err) return res.status(401).json({ msg: "logout failed!!" })
            req.session.destroy();
            return res.redirect(`${CLIENT_BASE_URL}/`); //redirect back to the frontend home page
        });
    } else {
        res.send("user is already logged out!");
    }
})

app.listen(4000, () => console.log("server is running on 4000"))