const jwt = require("jsonwebtoken");

const createJwtAccessToken = (user) => {
    const payload = {
        sub: user._id || user.sub
    }

    const options = {
        expiresIn: "30s"
    }

    return jwt.sign(payload, process.env.JWT_SECRET_TOKEN, options)
}

const createJwtRefreshToken = (user) => {
    const payload = {
        sub: user._id
    }

    const options = {
        expiresIn: "1d"
    }

    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN, options)
}

const generateNewAccessToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN, (err, user) => {
        if (err) return undefined
        console.log(user, "EMBED SUB!!")
        const accessToken = createJwtAccessToken(user)
        return accessToken;
    })
}

// const generateNewAccessToken = (refreshToken) => {
//     let newToken = null
//     try {
//         newToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN)
//     } catch (err) {
//         console.log("new access code error")
//         return false
//     } 
//     return newToken
// }

// const generateNewAccessToken = (refreshToken, user) => {
//     return jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN, (err) => {
//         if(err) return undefined
//         const accessToken = createJwtAccessToken(user)
//         return accessToken;
//     })
// }

const verifyAccessTokenVilidity = (accessToken, refreshToken) => {
    let tokenVerified = null

    console.log(accessToken, refreshToken)

    if (accessToken && refreshToken) {
        try {
            tokenVerified = jwt.verify(accessToken, process.env.JWT_SECRET_TOKEN)
        } catch (err) {
            console.log("jwt token validity failed", err)
            tokenVerified = generateNewAccessToken(refreshToken)
            console.log("new token is assigned", tokenVerified)
        }
    } else {
        return false
    }

    console.log("tokenVerified", tokenVerified)

    return tokenVerified
}

// const extractUserFromToken = (accessToken) => {
//     return jwt.verify(accessToken, process.env.JWT_SECRET_TOKEN, (err, user) => {
//         if(err) return undefined
//         console.log(user, "user?!?!")
//         return user
//     })
// }

const extractUserFromToken = (accessToken) => {
    console.log(accessToken, "!!")
    // const test = jwt.verify(accessToken, process.env.JWT_SECRET_TOKEN)
    // console.log(test, "testing!!")

    // return test

    let test = null

    try {
        test = jwt.verify(accessToken, process.env.JWT_SECRET_TOKEN)
    } catch (err) {
        console.log("user extraction has failed!!", err)
        return false
    }

    return test
}

module.exports = {
    createJwtAccessToken,
    createJwtRefreshToken,
    extractUserFromToken,
    verifyAccessTokenVilidity
}