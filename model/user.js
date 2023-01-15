const mongoose = require("mongoose");
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: Schema.Types.String,
    profileId: Schema.Types.String,
});

module.exports = mongoose.model("user", userSchema);