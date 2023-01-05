const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Comment = new Schema({
    body: {type: Schema.Types.String, required: true},
    created: {type: Schema.Types.Date, required: true},
    userId: {type: Schema.Types.ObjectId, ref: "user"},
    postId: {type: Schema.Types.ObjectId, ref: "post"},
    engaggedUsers: Schema.Types.Array,
    mfBuffer: Schema.Types.Buffer,
    mfUrl: Schema.Types.String,
    likesCount: Schema.Types.Number,
    loveCount: Schema.Types.Number,
    dislikesCount: Schema.Types.Number,
    shareCount: Schema.Types.Number
});

module.exports = mongoose.model("comment", Comment);