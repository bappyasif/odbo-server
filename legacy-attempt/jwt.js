const jwt = require("jsonwebtoken");

// const generateJwtAccessToken = (user) => {
//     return jwt.sign(user, process.env.JWT_SECRET, {expiresIn: "30s"})
// }

// const generateJwtRefreshToken = (user) => {
//     return jwt.sign(user, process.env.REFRESH_TOKEN)
// }

const generateJwtAccessToken = (user) => {
    const payload = {
        sub: user.id
    }
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "30s"})
}

const generateJwtRefreshToken = (user) => {
    const payload = {
        sub: user.id
    }
    return jwt.sign(payload, process.env.REFRESH_TOKEN)
}

const verifyRefreshTokenAndProvideAnAccessToken = (refreshTokenFromRequest) => {
    return jwt.verify(refreshTokenFromRequest, process.env.REFRESH_TOKEN, (err, user) => {
        if(err) return undefined
        const accessToken = generateJwtAccessToken(user)
        return accessToken;
    })
}

const verifyTokenAndExtractUserId = (accessToken) => {
    return jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        if(err) return undefined
        console.log(user, 'user!!')
        return user
    })
}

// const verifyJwtAccessToken = (accessTokenFromRequest) => {
//     return jwt.verify(accessTokenFromRequest, process.env.JWT_SECRET)
// }

// const verifyJwtAccessToken = (accessTokenFromRequest, refreshTokenFromRequest) => {
//     if(!accessTokenFromRequest) return false
    
//     const tokenVerifed = jwt.verify(accessTokenFromRequest, process.env.JWT_SECRET)
//     console.log(tokenVerifed, 'tokenVerifed!!')

//     if(!tokenVerifed) return false

//     if(!tokenVerifed && refreshTokenFromRequest) {
//         tokenVerifed = verifyRefreshTokenAndProvideAnAccessToken(refreshTokenFromRequest)
//         console.log("running refresh!!")
//     }

//     return tokenVerifed
// }

const verifyJwtAccessToken = (accessTokenFromRequest, refreshTokenFromRequest) => {
    if(!accessTokenFromRequest) return false
    
    let tokenVerifed = null;
    // console.log(tokenVerifed, 'tokenVerifed!!')

    try {
        tokenVerifed = jwt.verify(accessTokenFromRequest, process.env.JWT_SECRET)
    } catch(err) {
        tokenVerifed = verifyRefreshTokenAndProvideAnAccessToken(refreshTokenFromRequest)
        // console.log("running refresh!!")
    }

    if(!tokenVerifed) return false

    return tokenVerifed
}

module.exports = {
    generateJwtAccessToken,
    generateJwtRefreshToken,
    verifyJwtAccessToken,
    verifyRefreshTokenAndProvideAnAccessToken,
    verifyTokenAndExtractUserId
} 