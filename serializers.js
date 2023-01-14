const User = require("./models/user");

const user = {
    serialize: (user, done) => {
        console.log(user.id, "serialize", user._id)
        // done(null, user.id)
        // rather serializing user with record id on db
        done(null, user._id)
    },

    // for some reason de serialize is not getting called from Live Hosted site!!!!
    deserialize: (userId, done) => {
        console.log(userId, "de-serialize")
        // User.findOne({id: userId}).then((foundUser) => done(null, foundUser));
        // using db id for this deserialization process
        User.findById(userId, (err, user) => {
            if(err){
                done(null, false, {error:err});
            } else {
                done(null, user);
                console.log(user.id, "from deserialize")
            }
        })
    }
}

module.exports = user;