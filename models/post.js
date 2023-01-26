const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Post = new Schema({
    body: {type: Schema.Types.String, required: true},
    created: {type: Schema.Types.Date, required: true},
    userId: {type: Schema.Types.ObjectId, ref: "user"},
    privacy: Schema.Types.String,
    imageUrl: Schema.Types.String,
    videoUrl: Schema.Types.String,
    poll: Schema.Types.Array,
    // gif:  Schema.Types.Array,
    gif: Schema.Types.String,
    includedSharedPostId: Schema.Types.String,
    usersEngagged: Schema.Types.Array,
    likesCount: Schema.Types.Number,
    loveCount: Schema.Types.Number,
    dislikesCount: Schema.Types.Number,
    shareCount: Schema.Types.Number,
    commentsCount: Schema.Types.Number,
    othersCount: Schema.Types.Number,
    mfBuffer: Schema.Types.Buffer,
    mfUrl: Schema.Types.String,
})

module.exports = mongoose.model("post", Post);