const { body, validationResult, check } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { generateJwtAccessToken, generateJwtRefreshToken, verifyJwtAccessToken, verifyTokenAndExtractUserId } = require("../jwt");
const router = require("express").Router();

const hashedPassword = (password) => bcrypt.hash(password, 11).then(hashed => hashed).catch(err => console.log("hash error!!", err))

const verifyPassword = (currentPassword, storedPassword) => {
    return bcrypt.compare(currentPassword, storedPassword).then(matched => matched).catch(err => console.log("compare error!!", err))
}

const assignTokens = (req, user) => {
    const accessToken = generateJwtAccessToken(user)
    const refreshToken = generateJwtRefreshToken(user);

    req.session.token = accessToken;
    req.session.refreshToken = refreshToken

    req.session.user = user;
    req.session.isAuth = true;

    console.log(accessToken, refreshToken)
}

router.post("/login", [
    check("email", "needs to be of email type").isEmail().normalizeEmail().escape(),
    check("password", "needs to be at least of 4 characters long").isLength({ min: 4 }).escape(),
    (req, res) => {
        const errors = validationResult(req);

        // console.log(req.body.email, req.body.password, req.body)

        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: "error occured, these needs to be corrected", errors: errors.array() })
        }

        User.findOne({ email: req.body.email })
            .then(currentUser => {
                if (currentUser) {
                    verifyPassword(req.body.password, currentUser.password)
                        .then(matched => {
                            if (matched) {
                                assignTokens(req, currentUser);

                                return res.status(200).json({ msg: "user is found and also authenticated!!", user: currentUser, token: req.session.token, refreshToken: req.session.refreshToken })
                            } else {
                                return res.status(401).json({ msg: "password mismatched!!" })
                            }
                        })
                    const checkPassword = currentUser.password === req.body.password
                    // console.log(currentUser.password, checkPassword, req.body.password, currentUser)
                    // if(checkPassword) {
                    //     return res.status(200).json({msg: "user is found and also authenticated!!"})
                    // } else {
                    //     return res.status(401).json({msg: "password mismatched!!"})    
                    // }
                } else {
                    return res.status(401).json({ msg: "user is not found!!" })
                }
            }).catch(err => res.status(403).json({ msg: err }))

    }
]);

router.post("/register", [
    body("name", "name must be present").trim().isLength({ min: 1 }).escape(),
    body("email", "value must be of type email").normalizeEmail().isEmail(),
    body("password", "value must be 4 or more characters long").trim().isLength({ min: 4 }),
    body("confirm").exists().custom((val, { req }) => val === req.body.password),

    (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: "error occurred, needs to be corrected", errors: errors.array() })
        }

        User.findOne({ email: req.body.email })
            .then(user => {
                if (user) {
                    res.status(401).json({ msg: "email is already taken, try another" })
                } else {
                    hashedPassword(req.body.password)
                        .then(hashed => {
                            const newUser = new User({
                                name: req.body.name,
                                email: req.body.email,
                                password: hashed,
                                id: req.body.email + req.body.password
                            })

                            console.log(newUser, "newUser!!")

                            // return res.status(200).json({msg: "user is created and also authenticated!!", user: user})

                            newUser.save((err, user) => {
                                if (err) return res.status(500).json({ msg: "server error!! save failed!!" + err })

                                assignTokens(req, user);

                                console.log("new user is saved in db")
                                return res.status(200).json({ msg: "user is created and also authenticated!!", user: user, token: req.session.token, refreshToken: req.session.refreshToken })
                            })
                        })
                }
            })
    }
])

const checkUserIsAuthenticated = (req, res, next) => {
    if(req.session.token && req.session.refreshToken) {
        const vaildAccessToken = verifyJwtAccessToken(req.session.token, req.session.refreshToken)
        
        if(vaildAccessToken) {
            req.session.token = vaildAccessToken;
            next();
        } else {
            return res.status(401).json({msg: "token is not valid!!"})
        }
        
    } else {
        return res.status(401).json({msg: "access unauthorized!!"})
    }
}

router.get("/secretRoute", checkUserIsAuthenticated, (req, res) => {
    console.log(req.session.token, Boolean(req.session.refreshToken));
    res.status(200).json({msg: "auth valid!!", user: req.user, token: req.session.refreshToken, refreshToken: req.session.refreshToken })
})

router.get("/userSecrets", checkUserIsAuthenticated, (req, res) => {
    console.log(Boolean(req.session.token), Boolean(req.session.refreshToken), req.session.user);
    verifyTokenAndExtractUserId(req.session.token)
    res.status(200).json({msg: "auth secrets!!", user: req.session.user, token: req.session.refreshToken, refreshToken: req.session.refreshToken })
})

// router.post("/login", (req, res) => {
//     console.log(req.body)
//     res.status(200).json({msg: "registration alive"})
// })

// router.get("/register", (req, res) => {
//     res.status(200).json({msg: "registration alive"})
// })

module.exports = router;