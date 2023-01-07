const bcrypt = require("bcrypt");

const generateHashedPassword = (password) => {
    const salt = crypto.randomBytes(32).toString("hex");
    return bcrypt.hash(password, salt)
    .then(hashedPassword => hashedPassword)
    .catch(err => console.log('hashed error', err))
}

const compareHashedPassword = (currentHash, storedHash) => {
    return bcrypt.compare(currentHash, storedHash)
    .then(result => result)
    .catch(err => console.log('compared error', err))
}

module.exports = {
    generateHashedPassword,
    compareHashedPassword
}