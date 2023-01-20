require("./configs/database");
const cors = require("cors");
const express = require("express");
const path = require("path");
const routes = require("./routes")
const app = express();
const User = require("./models/user");
require("./configs/passport")
const cookieSession = require("cookie-session");
const passport = require("passport");

// settingup cookie
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // cookie time in millis
    keys: [process.env.PASSPORT_KEY]
}))

// initilize passport
app.use(passport.initialize())
app.use(passport.session())

app.use(cors({
    origin: [
        "http://localhost:3001",
        "https://odbo-live.vercel.app",
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`))