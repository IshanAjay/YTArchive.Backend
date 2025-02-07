import expressLib, { Express, Request, Response, NextFunction } from 'express';
import fs from "fs";

import { computeHashFromUrl, sha256File } from '../tools/encoding/sha256';
import { getChannelRevisionWith } from '../tools/searchingTools';
import { YT_DATA_API_KEY } from '../data/YOUTUBE_DATA_API_KEY';

export const indexChannelPageRouter = expressLib.Router()

function parseYTKeywords(keywordsRaw: string): string {
    let notInQuotes:boolean;
    let keywords=''
    notInQuotes=true;
    for (const character of keywordsRaw) {
        if (character=="\"") {
            notInQuotes = !notInQuotes
        }
        if (character==" " && notInQuotes) {
            keywords+='\n'
        }
        if ((!notInQuotes || (character!=" " && character!="\n")) && character!="\"") {
            keywords += character
        }
    }
    return keywords
}

function parseYTTopics(topicsRaw: Record<string,Array<string>>): Record<string,string> {
    const topicIDsOrdered = topicsRaw['topicIds']
    const topicsWikipediaOrdered = topicsRaw['topicCategories']

    const newObject: Record<string,string> = {}

    if (!(topicIDsOrdered.length === topicsWikipediaOrdered.length)) {
        throw TypeError("Topic ID and topic category mismatched!")
    }
    let idx = 0
    topicIDsOrdered.forEach(topicID => {
        newObject[topicID] = topicsWikipediaOrdered[idx]
        idx++
    })
    return newObject
}

function compareObjects(obj1:any, obj2:any) {
    // Check if both are objects
    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
        // Check if both are null (since typeof null is 'object')
        if (obj1 === null || obj2 === null) return obj1 === obj2;
        
        // Check if they have the same number of keys
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;

        // Recursively check each property
        for (let key of keys1) {
            if (!compareObjects(obj1[key], obj2[key])) return false;
        }

        return true;
    }

    // For non-objects, check for strict equality
    return obj1 === obj2;
}

indexChannelPageRouter.get("/:channelID", async (req,res) => {
    const channelID = req.params.channelID
    const OGIndex = !fs.existsSync(`./serverResources/channels/${channelID}`)
    const newRevID = Math.floor(Date.now() / 1000)
    try {
        fs.mkdirSync(`./serverResources/channels/${channelID}/${newRevID}/stats`, {recursive:true})

        // Make YouTube API request
        const ytRequest = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${YT_DATA_API_KEY}&part=brandingSettings,contentDetails,localizations,snippet,statistics,status,topicDetails&id=${channelID}`)
        if ((await ytRequest.clone().json())['pageInfo']['totalResults'] == 0) {
            res.send("Invalid CID!")
            return
        }
        const ytData =( await ytRequest.clone().json())['items'][0]
        //console.log(ytData)
        // Store the creation date to the channel folder if necessary
        if (!fs.existsSync('./serverResources/channels/'+channelID+'/constants_publishedAt.txt')) {
            const date = new Date(ytData['snippet']['publishedAt'])
            fs.writeFileSync('./serverResources/channels/'+channelID+'/constants_publishedAt.txt',String(Math.floor(date.getTime()/1000)))
        }

        // Initialize changes
        const changes = {
            OGIndex:OGIndex,
            topicInfo:false, // Done implementing
            relatedPlaylists:false, // Done implementing
            channelTitle:false, // Done implementing
            channelDescription:false, // Done implementing
            channelPFP: false, // Done implementing
            channelBanner:false, // Done implementing
            handle:false, // Done implementing
            country:false, // Done implementing
            keywords:false, // Done implementing
            unsubbedTrailer:false, // Done implementing
            stats:{
                videos:false, // Done implementing
                views:false, // Done implementing
                subCount:false // Done implementing
            },
            localizationInfo:false,
            viewability:false // Includes made for kids, is linked, and long uploads status
        }

        // Store topic info to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/topicInfo.json`,JSON.stringify(parseYTTopics(ytData['topicDetails'])))
        } else {
            const oldTopicDetails = fs.readFileSync(`./serverResources/channels/${channelID}/${getChannelRevisionWith("topicInfo.json",channelID)}/topicInfo.json`,{encoding:"utf8"})
            if (!compareObjects(parseYTTopics(ytData['topicDetails']), JSON.parse(oldTopicDetails))) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/topicInfo.json`,JSON.stringify(parseYTTopics(ytData['topicDetails'])))
                changes['topicInfo'] = true
            }
        }

        // Store related playlists to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/relatedPlaylists.json`,JSON.stringify(ytData['contentDetails']['relatedPlaylists']))
        } else {
            const oldRelatedPlaylists = fs.readFileSync(`./serverResources/channels/${channelID}/${getChannelRevisionWith("relatedPlaylists.json",channelID)}/relatedPlaylists.json`,{encoding:"utf8"})
            if (!compareObjects(ytData['contentDetails']['relatedPlaylists'],JSON.parse(oldRelatedPlaylists))) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/relatedPlaylists.json`,JSON.stringify(ytData['contentDetails']['relatedPlaylists']))
                changes['relatedPlaylists'] = true
            }
        }

        // Store channel title to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelTitle.txt`,ytData['snippet']['title'])
        } else {
            const oldRelatedPlaylists = fs.readFileSync(`./serverResources/channels/${channelID}/${getChannelRevisionWith("channelTitle.txt",channelID)}/channelTitle.txt`,{encoding:"utf8"})
            if (ytData['snippet']['title'] != oldRelatedPlaylists) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelTitle.txt`,ytData['snippet']['title'])
                changes['channelTitle'] = true
            }
        }

        // Store channel description to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelDescription.txt`,ytData['snippet']['description'])
        } else {
            const oldRelatedPlaylists = fs.readFileSync(`./serverResources/channels/${channelID}/${getChannelRevisionWith("channelDescription.txt",channelID)}/channelDescription.txt`,{encoding:"utf8"})
            if (ytData['snippet']['description'] != oldRelatedPlaylists) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelDescription.txt`,ytData['snippet']['description'])
                changes['channelDescription'] = true
            }
        }

        // Store channel profile picture to revision folder if necessary
        if (OGIndex) {
            const youtubePFP = ytData['snippet']['thumbnails']['high']['url']
            const youtubePFPRequest = await fetch(youtubePFP)
            const youtubePFPExtension = youtubePFPRequest.headers.get("Content-Type")?.split("/")[1]
            const youtubePFPData = await youtubePFPRequest.arrayBuffer()

            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelProfilePicture.${youtubePFPExtension}`, Buffer.from(youtubePFPData))
        } else {
            const youtubePFP = ytData['snippet']['thumbnails']['high']['url']
            const youtubePFPRequest = await fetch(youtubePFP)
            const youtubePFPExtension = youtubePFPRequest.headers.get("Content-Type")?.split("/")[1]
            const youtubePFPData = await youtubePFPRequest.arrayBuffer()

            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelProfilePicture.${youtubePFPExtension}`, Buffer.from(youtubePFPData))
            const oldPFPPath = `./serverResources/channels/${channelID}/${getChannelRevisionWith("channelProfilePicture."+youtubePFPExtension,channelID)}/channelProfilePicture.${youtubePFPExtension}`
            
            if (sha256File(`./serverResources/channels/${channelID}/${newRevID}/channelProfilePicture.${youtubePFPExtension}`) == sha256File(oldPFPPath)) {
                fs.unlinkSync(`./serverResources/channels/${channelID}/${newRevID}/channelProfilePicture.${youtubePFPExtension}`)
            } else {changes['channelPFP']=true}
        }

        // Store channel banner to revision folder if necessary
        if (OGIndex) {
            const youtubeBanner = (ytData['brandingSettings']['image']??{})['bannerExternalUrl']??''
            const youtubeBannerRequest = await fetch(youtubeBanner)
            const youtubeBannerExtension = youtubeBannerRequest.headers.get("Content-Type")?.split("/")[1]
            const youtubeBannerData = await youtubeBannerRequest.arrayBuffer()

            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelBannerImage.${youtubeBannerExtension}`, Buffer.from(youtubeBannerData))
        } else {
            const youtubeBanner = (ytData['brandingSettings']['image']??{})['bannerExternalUrl']??''
            const youtubeBannerRequest = await fetch(youtubeBanner)
            const youtubeBannerExtension = youtubeBannerRequest.headers.get("Content-Type")?.split("/")[1]
            const youtubeBannerData = await youtubeBannerRequest.arrayBuffer()

            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/channelBannerImage.${youtubeBannerExtension}`, Buffer.from(youtubeBannerData))
            const oldBannerPath = `./serverResources/channels/${channelID}/${getChannelRevisionWith("channelBannerImage."+youtubeBannerExtension,channelID)}/channelBannerImage.${youtubeBannerExtension}`
            
            if (sha256File(`./serverResources/channels/${channelID}/${newRevID}/channelBannerImage.${youtubeBannerExtension}`) == sha256File(oldBannerPath)) {
                fs.unlinkSync(`./serverResources/channels/${channelID}/${newRevID}/channelBannerImage.${youtubeBannerExtension}`)
            } else {changes['channelBanner']=true}
        }

        // Store channel handle to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/handle.txt`,ytData['snippet']['customUrl'])
        } else {
            const oldHandle = `./serverResources/channels/${channelID}/${getChannelRevisionWith("handle.txt",channelID)}/handle.txt`
            const oldHandleData = fs.readFileSync(oldHandle, {encoding:"utf-8"})

            if (oldHandleData != ytData['snippet']['customUrl']) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/handle.txt`,ytData['snippet']['customUrl'])
                changes['handle'] = true
            }
        }

        // Store channel country to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/country.txt`,ytData['snippet']['country']??"")
        } else {
            const oldCountry = `./serverResources/channels/${channelID}/${getChannelRevisionWith("country.txt",channelID)}/country.txt`
            const oldCountryData = fs.readFileSync(oldCountry, {encoding:"utf-8"})

            if (oldCountryData != (ytData['snippet']['country']??"")) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/country.txt`,ytData['snippet']['country']??"")
                changes['country'] = true
            }
        }

        // Store channel keywords to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/keywords.txt`,parseYTKeywords(ytData['brandingSettings']['channel']['keywords']??""))
        } else {
            const oldKeywords = `./serverResources/channels/${channelID}/${getChannelRevisionWith("keywords.txt",channelID)}/keywords.txt`
            const oldKeywordsData = fs.readFileSync(oldKeywords, {encoding:"utf-8"})

            if (oldKeywordsData != parseYTKeywords(ytData['brandingSettings']['channel']['keywords']??"")) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/keywords.txt`,parseYTKeywords(ytData['brandingSettings']['channel']['keywords']??""))
                changes['keywords'] = true
            }
        }

        // Store channel unsubscribed trailer to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/unsubbedTrailer.txt`,ytData['brandingSettings']['channel']['unsubscribedTrailer']??"__YTARCHIVE_NOTRAILER")
        } else {
            const oldTrailer = `./serverResources/channels/${channelID}/${getChannelRevisionWith("unsubbedTrailer.txt",channelID)}/unsubbedTrailer.txt`
            const oldTrailerData = fs.readFileSync(oldTrailer, {encoding:"utf-8"})

            if (oldTrailerData != (ytData['brandingSettings']['channel']['unsubscribedTrailer']??"__YTARCHIVE_NOTRAILER")) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/unsubbedTrailer.txt`,ytData['brandingSettings']['channel']['unsubscribedTrailer']??"__YTARCHIVE_NOTRAILER")
                changes['unsubbedTrailer'] = true
            }
        }

        // Store channel views to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/stats/views.txt`,ytData['statistics']['viewCount'])
        } else {
            const oldViews = `./serverResources/channels/${channelID}/${getChannelRevisionWith("stats/views.txt",channelID)}/stats/views.txt`
            const oldViewsData = fs.readFileSync(oldViews, {encoding:"utf-8"})

            if (oldViewsData != ytData['statistics']['viewCount']) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/stats/views.txt`,ytData['statistics']['viewCount'])
                changes['stats']['views'] = true
            }
        }

        // Store channel subs to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/stats/subscribers.txt`,ytData['statistics']['subscriberCount']??"__YTARCHIVE_SUB_COUNT_HIDDEN")
        } else {
            const oldSubs = `./serverResources/channels/${channelID}/${getChannelRevisionWith("stats/subscribers.txt",channelID)}/stats/subscribers.txt`
            const oldSubsData = fs.readFileSync(oldSubs, {encoding:"utf-8"})

            if (oldSubsData != (ytData['statistics']['subscriberCount']??"__YTARCHIVE_SUB_COUNT_HIDDEN")) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/stats/subscribers.txt`,ytData['statistics']['subscriberCount']??"__YTARCHIVE_SUB_COUNT_HIDDEN")
                changes['stats']['subCount'] = true
            }
        }

        // Store channel video count to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/stats/videos.txt`,ytData['statistics']['videoCount']??"__YTARCHIVE_VIDEO_COUNT_HIDDEN")
        } else {
            const oldVideoCount = `./serverResources/channels/${channelID}/${getChannelRevisionWith("stats/subscribers.txt",channelID)}/stats/videos.txt`
            const oldVideoCountData = fs.readFileSync(oldVideoCount, {encoding:"utf-8"})

            if (oldVideoCountData != (ytData['statistics']['videoCount']??"__YTARCHIVE_VIDEO_COUNT_HIDDEN")) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/stats/videos.txt`,ytData['statistics']['videoCount']??"__YTARCHIVE_VIDEO_COUNT_HIDDEN")
                changes['stats']['videos'] = true
            }
        }

        // Store channel localization to revision folder if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/localizations.json`,JSON.stringify(ytData['localizations']??{}))
        } else {
            const oldLocalization = `./serverResources/channels/${channelID}/${getChannelRevisionWith("localizations.json",channelID)}/localizations.json`
            const oldLocalizationData = fs.readFileSync(oldLocalization,{encoding:"utf-8"})
            
            if (!compareObjects(JSON.parse(oldLocalizationData),ytData['localizations']??{})) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/localizations.json`,JSON.stringify(ytData['localizations']??{}))
                changes['localizationInfo']=true
            }
        }

        // Store channel viewability to revision folder if necessary
        if (OGIndex) {
            const viewability = {
                isLinked:ytData['status']['isLinked'],
                madeForKids:ytData['status']['madeForKids'],
                longUploadsStatus:ytData['status']['longUploadsStatus']
            }

            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/viewabilityInfo.json`,JSON.stringify(viewability))
        } else {
            const oldViewability = `./serverResources/channels/${channelID}/${getChannelRevisionWith("viewabilityInfo.json",channelID)}/viewabilityInfo.json`
            const oldViewabilityData = fs.readFileSync(oldViewability,{encoding:"utf-8"})

            const viewability = {
                isLinked:ytData['status']['isLinked'],
                madeForKids:ytData['status']['madeForKids'],
                longUploadsStatus:ytData['status']['longUploadsStatus']
            }
            if (!compareObjects(JSON.parse(oldViewabilityData),viewability)) {
                fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/viewabilityInfo.json`,JSON.stringify(viewability))
                changes['viewability'] = true
            }
        }

        if (!OGIndex) {
            const noChanges = {
                OGIndex:OGIndex,
                topicInfo:false,
                relatedPlaylists:false,
                channelTitle:false,
                channelDescription:false,
                channelPFP: false,
                channelBanner:false,
                handle:false,
                country:false,
                keywords:false,
                unsubbedTrailer:false,
                stats:{
                    videos:false,
                    views:false,
                    subCount:false
                },
                localizationInfo:false,
                viewability:false
            }
            fs.writeFileSync(`./serverResources/channels/${channelID}/${newRevID}/changes.json`,JSON.stringify(changes))
            if (compareObjects(noChanges,changes)) {
                fs.rmSync(`./serverResources/channels/${channelID}/${newRevID}`, {recursive:true})
            }
        }
        res.status(200).send(changes)
    } catch (e) {
        console.log(e)
        if (OGIndex) {
            fs.rmSync("./serverResources/channels/"+channelID, {recursive:true,force:true})
        } else {
            fs.rmSync("./serverResources/channels/"+channelID+"/"+newRevID, {recursive:true,force:true})
        }
        res.send("EIndexFailed\n"+e)
        return
    }
})

module.exports = indexChannelPageRouter