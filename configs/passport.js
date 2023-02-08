const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const TwitterStrategy =  require("passport-twitter").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt =  require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;
const path = require("path");
const fs = require("fs");
const User = require("../models/user");

const baseUrlForAuth = "https://busy-lime-dolphin-hem.cyclic.app"
// const baseUrlForAuth = "http://localhost:3000"

let findOrCreateuser = (profileName, profileId, userData, done) => {
    User.findOne({ [profileName]: profileId })
        .then(currentUser => {
            if (currentUser) {
                // found user in db
                console.log("user found")
                done(null, currentUser)
            } else {
                // as new user is getting created, adding created date timestamp, just for one time only
                userData.created = new Date().toISOString();

                new User(userData).save().then(newUser => {
                    console.log("new user is created")
                    done(null, newUser)
                })
                    .catch(err => done(err))
            }
        })
}

passport.serializeUser((user, done) => {
    // console.log(user, "Serialize")
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    // console.log(id, "De-Serialize")
    User.findById(id).then(user => {
        done(null, user)
    })
})

// =============================FOR ALL STRATEGIES USER DATA GENERATIONS================================ //

let strategyUserDataGenerations = (profileData, whichStrategy) => {
    let uId = profileData.id;
    let name = profileData.displayName || `${profileData.name.givenName} ${profileData.name.familyName}`;
    let email = profileData.emails ? profileData?.emails[0]?.value : "not@found.com"
    let profilePicture = profileData.photos ? profileData.photos[0]?.value : null

    let userData = {
        fullName: name,
        [whichStrategy]: uId,
        email: email,
        password: "test",
        ppUrl: profilePicture,
    }

    return userData;
}

// =============================GOOGLE STRATEGY================================ //

let strategyOptions = {
    // options for google strategy
    callbackURL: `${baseUrlForAuth}/auth/google/redirect`,
    clientID: process.env.GOOGLE_PLUS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_PLUS_CLIENT_SECRET
}

let strategyCallback = (accessToken, refreshToken, profileData, done) => {
    let uId = profileData.id
    let userData = strategyUserDataGenerations(profileData, "profileID")

    // console.log(accessToken, refreshToken, "GS Callback")

    findOrCreateuser("profileID", uId, userData, done)
}

let googleStrategy = new GoogleStrategy(strategyOptions, strategyCallback);

// =============================FACEBOOK STRATEGY================================ //
let fbStrategyOptions = {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${baseUrlForAuth}/auth/facebook/redirect`,
    profileFields: ['id', 'emails', 'name']
}

let fbStrategyCallback = (accessToken, refreshToken, profileData, done) => {
    let uId = profileData.id
    let userData = strategyUserDataGenerations(profileData, "facebookID")

    findOrCreateuser("facebookID", uId, userData, done)
}

let fbStrategy = new FacebookStrategy(fbStrategyOptions, fbStrategyCallback);


// =============================GITHUB STRATEGY================================ //
let githubStrategyOptions = {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${baseUrlForAuth}/auth/github/redirect`,
}

let githubStrategyCallback = (accessToken, refreshToken, profileData, done) => {
    let uId = profileData.id
    let userData = strategyUserDataGenerations(profileData, "githubID")

    findOrCreateuser("githubID", uId, userData, done)
}

let githubStrategy = new GitHubStrategy(githubStrategyOptions, githubStrategyCallback)

// =============================TWITTER STRATEGY================================ //
let twitterStrategyOptions = {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: `${baseUrlForAuth}/auth/twitter/redirect`,
}

let twitterStrategyCallback = (accessToken, refreshToken, profileData, done) => {
    let uId = profileData.id
    let userData = strategyUserDataGenerations(profileData, "twitterID")

    findOrCreateuser("twitterID", uId, userData, done)
}

let twitterStrategy = new TwitterStrategy(twitterStrategyOptions, twitterStrategyCallback)

// =============================JWT STRATEGY================================ //
const pathToJwtPairedPublicKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const JWT_PAIRED_PUBLIC_KEY = fs.readFileSync(pathToJwtPairedPublicKey, "utf-8");

const jwtStrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_PAIRED_PUBLIC_KEY,
    algorithms: ["RS256"]
}

const jwtStrategyCallback = (payload, done) => {
    User.findOne({_id: payload.sub})
        .then(user => {
            if(user) {
                done(null, user)
            } else {
                done(null, false)
            }
        }).catch(err => done(err, false))
}

const jwtStrategy = new JwtStrategy(jwtStrategyOptions, jwtStrategyCallback);

// ==============STRATEGY USES======================= //
passport.use(jwtStrategy);
passport.use(twitterStrategy);
passport.use(githubStrategy);
passport.use(fbStrategy);
passport.use(googleStrategy);