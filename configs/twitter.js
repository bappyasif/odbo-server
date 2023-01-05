let { TwitterApi } = require("twitter-api-v2")
let needle = require("needle")

const endpointURL = "https://api.twitter.com/2/users/by?usernames="

async function getRequest() {

    // These are the parameters for the API request
    // specify User names to fetch, and any additional fields that are required
    // by default, only the User ID, name and user name are returned
    const params = {
        usernames: "bappyasif", // Edit usernames to look up
        "user.fields": "created_at,description", // Edit optional query parameters here
        "expansions": "pinned_tweet_id"
    }

    // this is the HTTP header that adds bearer token authentication
    const res = await needle('get', endpointURL, params, {
        headers: {
            "User-Agent": "v2UserLookupJS",
            "authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request')
    }
}

getRequest().then(resp => console.dir(resp, {depth: null})).catch(err=>console.error(err))