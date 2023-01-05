const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const pathToPrivKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const PRIVATE_KEY = fs.readFileSync(pathToPrivKey, "utf-8");

const pathToPubKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const PUBLIC_KEY = fs.readFileSync(pathToPubKey, "utf-8");

// This function uses the crypto library to decrypt the hash using the salt and then compares
// the decrypted hash/salt with the password that the user provided at login
const validatePassword = (password, hash, salt) => {
    let hashVerify = crypto.pbkdf2Sync(password, salt, 10001, 64, "sha512").toString("hex");
    return hashVerify === hash
}

// This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
// password in the database, the salt and hash are stored for security
const generatePassword = (password) => {
    const salt = crypto.randomBytes(32).toString("hex");
    const generateHash = crypto.pbkdf2Sync(password, salt, 10001, 64, "sha512").toString("hex");

    return {
        salt,
        hash: generateHash
    }
}

// JWT ISSUANCE, so that when time arrives we can take this signed token via private key and get it verified with our public key
// We need this(user) to set the JWT `sub` payload property to the MongoDB user ID
const issueJWT = (user) => {
    const userID = user?._id;
    // const expiresIn = "1d";
    const expiresIn = "30s";

    const payload = {
        sub: userID,
        iat: Date.now()
    }

    const options = {
        expiresIn,
        algorithm: "RS256"
    }

    const signedToken = jsonwebtoken.sign(payload, PRIVATE_KEY, options)

    return {
        token: `Bearer ${signedToken}`,
        expires: expiresIn
    }
}

const verifyJWT = (tokenString) => {
    const verification = jsonwebtoken.verify(tokenString, PUBLIC_KEY, { algorithms: ["RS256"] })
    return verification;    
}

module.exports = {
    validatePassword,
    generatePassword,
    issueJWT,
    verifyJWT
}