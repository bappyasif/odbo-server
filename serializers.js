const User = require("./models/user");

const user = {
    serialize: (user, done) => {
        console.log(user.id, "serialize")
        done(null, user.id)
    },

    deserialize: (userId, done) => {
        console.log(userId, "de-serialize")
        // User.findOne({id: userId}).then((foundUser) => done(null, foundUser));
        User.findOne( {id: userId}, (err, user) => {
            if(err){
                done(null, false, {error:err});
            } else {
                done(null, user);
            }
        })
    }
}

module.exports = user;