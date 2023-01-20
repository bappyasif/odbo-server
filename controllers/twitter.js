let { TwitterApi } = require("twitter-api-v2")
let needle = require("needle");
const { getDataFromTwitter } = require("../utils/httpRequests");

let getTweetsFromAccount = (req, res, next) => {
    let accountId = req.params.name;
    res.send("get tweet from account")
}

let getTweetsFromMultipleAccounts = (req, res, next) => {
    let endpoint = "https://api.twitter.com/2/users/?ids="
    // let endpoint = "https://api.twitter.com/2/users/by?usernames="
    
    for(let key in req.query) {
        endpoint+= req.query[key].toString() +","
    }
    
    let accountId = req.params.names;
    
    // console.log(req.params, "<><>", req.query, endpoint)
    
    const params = {
        // "usernames": "bappyasif,hoxieloxie",
        ids: "1957404727,3040721962",
        "user.fields": "created_at,description", // Edit optional query parameters here
        "expansions": "pinned_tweet_id"
    }

    getTweetsFromMultipleAccountIds(endpoint, params).then(results => console.log(results)).catch(err=>console.error(err))
    
    res.send("get tweets from multiple account")
}

let getTweetsAboutTopic = (req, res, next) => {
    let topicName = req.params.name;
    res.send("get tweets about topic")
}

let getTweetsAboutMultipleTopics = (req, res, next) => {
    let topicName = req.params.name;
    res.send("get tweets about multiple topic")
}

let getTopTwitterNews = (req, res, next) => {
    res.send("get top twitter news")
}

let getCurrentTrendingTweets = (req, res, next) => {
    res.send("get current trending tweets")
}

let searchRecentTweetsAboutTopic = (req, res, next) => {
    let endpoint = "https://api.twitter.com/2/tweets/search/recent"
    let searchTerm = req.params.term;

    const params = {
        "query": `${searchTerm} -is:retweet`,
        "user.fields": "created_at,description,name,username,public_metrics", // Edit optional query parameters here
        "tweet.fields": "attachments,author_id,created_at,public_metrics,source",
        "max_results": 11,
        "expansions": "attachments.media_keys",
        "media.fields": "url,preview_image_url,public_metrics,duration_ms",
        // "tweet_mode": "extended" // could be used for video url, but for a different endpoint "statuses/show"
    }

    let filtered = []
 
    getDataFromTwitter(endpoint, params, "v2RecentSearchJS").then(results => {

        filtered.push(results.includes ? results.includes : [])

        results?.data?.forEach(item => {
            // console.log("chk4 here!!")
            if(item.attachments) {
                filtered.push(item)
            }
        })

    }).catch(err=>console.error(err))
    .then(() => {
        res.status(200).json({success: true, data: filtered})
    })
}

let getSingleTweetData = (req, res, next) => {
    let endpoint = `https://api.twitter.com/2/tweets/${req.params.id}`
    let params = {
        "user.fields": "created_at,description,name,username", // Edit optional query parameters here
        "tweet.fields": "author_id,context_annotations",
        "expansions": "attachments.media_keys",
        "media.fields": "url,preview_image_url",
    }
}

let getUserAccountInfo = (req, res, next) => {
    let endpoint = `https://api.twitter.com/2/users/${req.params.id}`
    
    let params = {
        "user.fields": "profile_image_url,verified,created_at,public_metrics"
    }
    
    getDataFromTwitter(endpoint, params, "v2UserLookupJS")
    .then(result => {
        // console.log(result, "result!!")
        res.status(200).json({data: result.data, errors: []})
    }).catch(err => {
        console.error(err)
        res.status(402).json({data: {}, errors: err})
        return next(err)
    })
}

module.exports = {
    getUserAccountInfo,
    searchRecentTweetsAboutTopic,
    getTweetsFromAccount,
    getTweetsFromMultipleAccounts,
    getTweetsAboutTopic,
    getTweetsAboutMultipleTopics,
    getTopTwitterNews,
    getCurrentTrendingTweets
}