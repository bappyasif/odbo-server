const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {type: Schema.Types.String},
    id: {type: Schema.Types.String, unique: true},
    email: {type: Schema.Types.String, unique: true},
    password: {type: Schema.Types.String}
})

module.exports = mongoose.model("user", userSchema);