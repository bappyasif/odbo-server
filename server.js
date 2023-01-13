require("dotenv").config();
require("./passport");
require("./db");
const expressSession = require("express-session");
const MongoSession = require("connect-mongodb-session")(expressSession);
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const passportSetup = require("./passport");
const passport = require("passport");
const authRoute = require("./routes/auth");
const authEpRoute = require("./routes/auth-ep");
const app = express();

// creating session store for users in db
const store = new MongoSession({
    uri: process.env.DB_STR,
    collection: "userSessions"
})

// resaving cookie as im not currently using mongodb, otherwise i would have kept it as false
// app.use(
//     cookieSession({ name: "session", secret: process.env.SESSION_SECRET_KEYS, maxAge: 24 * 60 * 60 * 100, resave: true })
// );
app.use(expressSession({
    name: "session",
    secret: process.env.SESSION_SECRET_KEYS,
    maxAge: 100 * 60 * 60 * 24,
    resave: true,
    // these two options were causing session and authentication to be not false rather its was not showing up on broswer cookie when set to False
    // we can anytime add options and values to session from any requests to edit and change its value 
    saveUninitialized: false,
    // cookie: { secure: true }

    // now we can store it in opur session as well
    store: store
}));
// middleware to read cookies
app.use(cookieParser());
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: ["http://localhost:3000", "https://odbo-live.vercel.app"],
        methods: "GET,POST,PUT,DELETE",
        credentials: true,
    })
);

app.use("/auth", authRoute);
app.use("/ep-auth", authEpRoute);

app.listen("4000", () => {
    console.log("Server is running!");
});