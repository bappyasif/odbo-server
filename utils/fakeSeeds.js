let {faker} = require("@faker-js/faker");
const User = require("../models/user");
const Comment = require("../models/comment");
const Post = require("../models/post");

const generateSixFakeData = () => {
    for(let i = 0; i < 6; i++) {
        createFakeUserData()
        createFakeUserComment()
        createFakeUserPost()
    }
}

const createFakeUserData = () => {
    let fakeUser = new User({
        // fullName: faker.datatype.string(),
        fullName: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password(),
        friends: faker.datatype.array(4),
        frRecieved: faker.datatype.array(4),
        frSent: faker.datatype.array(4),
        ppUrl: faker.internet.url,
        bio: faker.lorem.lines(2),
        webLink: faker.internet.url,
        created: faker.date.recent()
    })

    fakeUser.save((err, _) => {
        if(err) console.error("errorr", err)
        console.log("success")
    })
}

const createFakeUserComment = () => {
    let fakeComment = new Comment({
        body: faker.datatype.string(33),
        created: faker.date.recent(),
        mfUrl: faker.internet.url(),
        likesCount: faker.datatype.number(),
        loveCount: faker.datatype.number(),
        dislikesCount: faker.datatype.number(),
        shareCount: faker.datatype.number()
    })

    fakeComment.save((err, _) => {
        if(err) console.error("error occured", err)
        else console.log("done")
    })
}

const createFakeUserPost = () => {
    let fakePost = new Post(
        {
            body: faker.datatype.string(33),
            created: faker.date.recent(),
            // userId: faker.datatype.string(22),
            // postId: faker.datatype.string(22),
            mfUrl: faker.internet.url(),
            likesCount: faker.datatype.number(),
            loveCount: faker.datatype.number(),
            dislikesCount: faker.datatype.number(),
            shareCount: faker.datatype.number()
        }
    )

    fakePost.save((err) => {
        if(err) console.error("errroorrr!!", err)
        else console.log("veel success")
    })
}

// createFakeUserComment()
// createFakeUserData();
generateSixFakeData();
module.exports = generateSixFakeData