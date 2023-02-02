const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Otp = new Schema({
    // id: Schema.Types.String,
    otp: Schema.Types.String,
    expDate: Schema.Types.Date,
    verified: Schema.Types.Boolean,
    // createdAt: Schema.Types.Date,
    // updatedAt: Schema.Types.Date
});

module.exports = mongoose.model("otp", Otp);