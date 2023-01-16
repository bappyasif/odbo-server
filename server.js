require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
// const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoSession = require("connect-mongodb-session")(session)
const passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("./model/user");
const app = express();

const REDIRECT_BASE_URL = "http://localhost:4000"
const CLIENT_BASE_URL = "http://localhost:3000"

// const REDIRECT_BASE_URL = "https://busy-lime-dolphin-hem.cyclic.app"
// const CLIENT_BASE_URL = "https://odbo-live.vercel.app"

mongoose.connect(process.env.DB_STR, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("database conected")).catch(err => console.log("database error!!", err));

const store = new MongoSession({
    uri: process.env.DB_STR,
    collection: "userSessions"
});

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(cors({
    origin: [CLIENT_BASE_URL],
    // methods: "GET,POST,PUT,DELETE",
    credentials: true,
}))

app.set("trust proxy", 1);

app.use(session({
    store,
    name: "sessionID",
    saveUninitialized: true,
    resave: true,
    secret: process.env.SESSION_SECRET_KEYS,
    cookie: {
        // when running from local host, it doesnt have any ssl protocol, so both secure and samesite origin actually makes cookies attachment requests invalid
        // sameSite: "none",
        // secure: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

// app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

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
                    console.log("create user thrown error")
                    cb(err, null)
                })
            }
        })
    }
));

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

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect(CLIENT_BASE_URL);
    });

const isAuth = (req, res, next) => {
    console.log(req.sessionID, "!!", req.cookies, req.signedCookies, req.session?.passport?.user, req.user)
    if (req.user || req.session?.passport?.user) {
        next()
    } else {
        res.status(401).json({ msg: "authentication failed!!" })
    }
}

app.get("/login/success", isAuth, (req, res) => {
    res.status(200).json({ msg: "successful authentication", user: req.user || req.session?.passport?.user })
})

app.get("/logout", (req, res) => {
    req.logOut(err => {
        if (err) return res.status(401).json({ msg: "logout failed!!" })
        return res.redirect(`${CLIENT_BASE_URL}/`)
    });
    //   res.redirect(CLIENT_BASE_URL);
    //   res.status(200).json({msg: "successfull logout"})
})

app.listen(4000, () => console.log("server is running on 4000"))