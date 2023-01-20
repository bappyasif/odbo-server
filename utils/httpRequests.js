let { TwitterApi } = require("twitter-api-v2")
let needle = require("needle")

let getDataFromTwitter = async (endpointURL, params, userAgent) => {
     // this is the HTTP header that adds bearer token authentication
    //  console.log(endpointURL, process.env.TWITTER_BEARER_TOKEN)
    //  endpoint = "https://api.twitter.com/2/tweets/search/recent?max_results=20&expansions=attachments.media_keys&media.fields=url&user.fields=name,username&query=party"
     const res = await needle('get', endpointURL, params, {
        headers: {
            // "User-Agent": "v2UserLookupJS",
            // "User-Agent": "v2TweetLookupJS",
            // "User-Agent": "v2RecentSearchJS",
            "User-Agent": `${userAgent}`,
            "authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
    })

    if(res.body) {
        return res.body
    } else {
        throw new Error("unsuccessful request")
    }
}

module.exports = {
    getDataFromTwitter
}