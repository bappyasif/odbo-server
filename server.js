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
const USER = require("./serializers");
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
// app.use(expressSession({
//     name: "session",
//     secret: process.env.SESSION_SECRET_KEYS,
//     maxAge: 100 * 60 * 60 * 24,
//     resave: true,
//     // these two options were causing session and authentication to be not false rather its was not showing up on broswer cookie when set to False
//     // we can anytime add options and values to session from any requests to edit and change its value 
//     saveUninitialized: false,
//     // cookie: { secure: true }

//     // now we can store it in opur session as well
//     store: store
// }));
app.use(expressSession({
     // Defaults to MemoryStore, meaning sessions are stored as POJOs
    // in server memory, and are wiped out when the server restarts.
    store,

    // Name for the session ID cookie. Defaults to 'connect.sid'.
    name: 'session',

    // Whether to force-save unitialized (new, but not modified) sessions
    // to the store. Defaults to true (deprecated). For login sessions, it
    // makes no sense to save empty sessions for unauthenticated requests,
    // because they are not associated with any valuable data yet, and would
    // waste storage. We'll only save the new session once the user logs in.
    saveUninitialized: false,

    // Whether to force-save the session back to the store, even if it wasn't
    // modified during the request. Default is true (deprecated). We don't
    // need to write to the store if the session didn't change.
    resave: false,

    // Whether to force-set a session ID cookie on every response. Default is
    // false. Enable this if you want to extend session lifetime while the user
    // is still browsing the site. Beware that the module doesn't have an absolute
    // timeout option (see https://github.com/expressjs/session/issues/557), so
    // you'd need to handle indefinite sessions manually.
    // rolling: false,

    // Secret key to sign the session ID. The signature is used
    // to validate the cookie against any tampering client-side.
    secret: process.env.SESSION_SECRET_KEYS,

    // Settings object for the session ID cookie. The cookie holds a
    // session ID ref in the form of 's:{SESSION_ID}.{SIGNATURE}' for example:
    // s%3A9vKnWqiZvuvVsIV1zmzJQeYUgINqXYeS.nK3p01vyu3Zw52x857ljClBrSBpQcc7OoDrpateKp%2Bc

    // It is signed and URL encoded, but NOT encrypted, because session ID is
    // merely a random string that serves as a reference to the session. Even
    // if encrypted, it still maintains a 1:1 relationship with the session.
    // OWASP: cookies only need to be encrypted if they contain valuable data.
    // See https://github.com/expressjs/session/issues/468

    cookie: {

      // Path attribute in Set-Cookie header. Defaults to the root path '/'.
      // path: '/',

      // Domain attribute in Set-Cookie header. There's no default, and
      // most browsers will only apply the cookie to the current domain.
      // domain: null,

      // HttpOnly flag in Set-Cookie header. Specifies whether the cookie can
      // only be read server-side, and not by JavaScript. Defaults to true.
      // httpOnly: true,

      // Expires attribute in Set-Cookie header. Set with a Date object, though
      // usually maxAge is used instead. There's no default, and the browsers will
      // treat it as a session cookie (and delete it when the window is closed).
      // expires: new Date(...)

      // Preferred way to set Expires attribute. Time in milliseconds until
      // the expiry. There's no default, so the cookie is non-persistent.
      maxAge: 1000 * 60 * 60 * 2,

      // SameSite attribute in Set-Cookie header. Controls how cookies are sent
      // with cross-site requests. Used to mitigate CSRF. Possible values are
      // 'strict' (or true), 'lax', and false (to NOT set SameSite attribute).
      // It only works in newer browsers, so CSRF prevention is still a concern.
      sameSite: true,
    }
}))
// middleware to read cookies
app.use(cookieParser());
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

// rather using serializer and de serializer beforehand 
// passport.initialize() and passport.session() middlewares need to attach to your express app instance before you define serialize and deserialize
passport.serializeUser(USER.serialize)
passport.deserializeUser(USER.deserialize)

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