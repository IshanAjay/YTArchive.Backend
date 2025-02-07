import expressLib, { Express, Request, Response, NextFunction } from 'express';
import fs from "fs";
import { Duration } from 'luxon'

import { sha256File, computeHashFromUrl } from '../tools/encoding/sha256';
import { getVideoRevisionWith } from '../tools/searchingTools';
import { downloadVideo } from '../tools/YTOps/downloadVideo/downloadYTVideo';
import { YT_DATA_API_KEY } from '../data/YOUTUBE_DATA_API_KEY';

export const indexVideoRouter = expressLib.Router();

indexVideoRouter.get("/:videoID", async (req, res) => {
    const OGIndex = !(fs.existsSync(`./serverResources/videos/${req.params.videoID}`))
    let channelID;
    const revID = Math.floor(Date.now() / 1000);
    try {
        /*
        ===========================================
        INITIALIZATION
        ===========================================
        */
    
        const vidID = req.params.videoID
    
        // Create folders
        fs.mkdirSync(`./serverResources/videos/${vidID}/constants`, { recursive: true })
        fs.mkdirSync(`./serverResources/videos/${vidID}/${revID}/tmp`, { recursive: true })
        fs.mkdirSync(`./serverResources/videos/${vidID}/${revID}/statistics`, { recursive: true })
        
        
        // Save folder locations to variables
        const newIndexDir = `./serverResources/videos/${vidID}/${revID}`
        const constantsDir = `./serverResources/videos/${vidID}/constants`
        
        // Begin video download in background
        const videoDownload = downloadVideo(vidID, `${newIndexDir}/video.mp4`, `${newIndexDir}/tmp`)
        
        // Make YouTube data API request
        const rq = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${YT_DATA_API_KEY}&id=${vidID}&part=statistics,contentDetails,snippet,status,player`)
        const videoMetadata = (await rq.json())['items'][0]
        
        // Initialize object for changes
        const changes = {
            constants:{
                'datePublished':false,
                'channelID':false
            },
            OGIndex: OGIndex,
            thumbnail: false,
            category: false,
            tags: false,
            title: false,
            description: false,
            regulation: false,
            videoFeaturesData: false,
            videoFile:false,
            stats: {
                likes:false,
                views:false,
                comments:false
            }
        }
        
        /*
        ===========================================
        VIDEO CONSTANTS
        ===========================================
        */
       
       // Store channel ID to constants if necessary
       if (!fs.existsSync(`${constantsDir}/channelID.txt`)) {
           fs.writeFileSync(`${constantsDir}/channelID.txt`, videoMetadata['snippet']['channelId'])
           if (!OGIndex) {changes['constants']['channelID'] = true}
        }
        
        // Store publish date to constants if necessary
        if (!fs.existsSync(`${constantsDir}/datePublished.txt`)) {
            const date = new Date(videoMetadata['snippet']['publishedAt'])
            fs.writeFileSync(`${constantsDir}/datePublished.txt`, String(Math.floor(date.getTime() / 1000)))
            if (!OGIndex) {changes['constants']['datePublished'] = true}
        }
        
        // Add video and publish date to video-channel database
        channelID = videoMetadata['snippet']['channelId']
        fs.mkdirSync(`./serverResources/channelVideosIndex/${videoMetadata['snippet']['channelId']}`, { recursive: true })
        const publishDateObj = new Date(videoMetadata['snippet']['publishedAt'])
        fs.writeFileSync(`./serverResources/channelVideosIndex/${videoMetadata['snippet']['channelId']}/${vidID}.txt`,String(Math.floor(publishDateObj.getTime() / 1000)))
    
        /*
        ===========================================
        REVISION-SPECIFIC DATA
        ===========================================
        */
    
        // Store thumbnail to revision if necessary
        let thumbnailURL;
        try {
            thumbnailURL = videoMetadata['snippet']['thumbnails']['maxres']['url']
        } catch {
            try {
                thumbnailURL = videoMetadata['snippet']['thumbnails']['hqdefault']['url']
            } catch {
                thumbnailURL = videoMetadata['snippet']['thumbnails']['default']['url']
            } 
        }
        const thumbnailFiletype = (await fetch(thumbnailURL, {method:'HEAD'})).headers.get('Content-Type')?.split('/')[1]
        if (OGIndex) {
            const thumbnailRequest = await fetch(thumbnailURL)
            const thumbnailData = await thumbnailRequest.arrayBuffer()
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/thumbnail.${thumbnailFiletype}`, Buffer.from(thumbnailData))
        } else {
            const thumbnailHash = await computeHashFromUrl(thumbnailURL)
            const oldThumbnailHash = sha256File(`./serverResources/videos/${vidID}/${getVideoRevisionWith('thumbnail.' + thumbnailFiletype,vidID, true)}/thumbnail.${thumbnailFiletype}`)
            if (thumbnailHash!=oldThumbnailHash) {
                const thumbnailRequest = await fetch(thumbnailURL)
                const thumbnailData = await thumbnailRequest.arrayBuffer()
                changes['thumbnail'] = true
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/thumbnail.${thumbnailFiletype}`, Buffer.from(thumbnailData))
            }
        }
    
        // Find category name based on ID and store it in revision if necessary
        // Categories are region-specific, so we have to use the categoryIDs.json file to look up name based on ID
        const catIDsFile = fs.readFileSync("./src/data/categoryIDs.json", {encoding:'utf-8'})
        const parsedCatIDs = JSON.parse(catIDsFile)
        const catIDList: Array<any> = parsedCatIDs['content']
        const catDataForVideo = catIDList.find(item => item.id == videoMetadata['snippet']['categoryId'])
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/categoryID.json`,
                catDataForVideo?
                JSON.stringify({
                    "categoryNumber":catDataForVideo.id,
                    "categoryName":catDataForVideo.title,
                    "assignable":catDataForVideo.assignable,
                    "channelID":catDataForVideo.channelID,
                    "type":catDataForVideo.kind
                })
                :
                '__YTARCHIVE_UNKNOWN'
            )
        } else {
            const oldRevWithCatID = getVideoRevisionWith('categoryID.json', vidID)
            const oldCatData = fs.readFileSync(`./serverResources/videos/${vidID}/${oldRevWithCatID}/categoryID.json`,{encoding:'utf-8'})
            if (sha256File(`./serverResources/videos/${vidID}/${oldRevWithCatID}/categoryID.json`) != sha256File(`./serverResources/videos/${vidID}/${oldRevWithCatID}/categoryID.json`)) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/categoryID.json`,
                    catDataForVideo?
                    JSON.stringify({
                        "categoryNumber":catDataForVideo.id,
                        "categoryName":catDataForVideo.title,
                        "assignable":catDataForVideo.assignable,
                        "channelID":catDataForVideo.channelID,
                        "type":catDataForVideo.kind
                    })
                    :
                    '__YTARCHIVE_UNKNOWN'
                )
                changes['category'] = true
            }
        }
    
        // Store tags to revision if necessary
        const videoTags: Array<string> = videoMetadata['snippet']['tags']??[]
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoTags.txt`,videoTags.join('\n'))
        } else {
            const oldTagsData = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('videoTags.txt', vidID)}/videoTags.txt`, {encoding:'utf-8'})
            if (videoTags.join('\n') != oldTagsData) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoTags.txt`,videoTags.join('\n'))
                changes['tags'] = true
            }
        }
    
        // Store title to revision if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoTitle.txt`, videoMetadata['snippet']['title'])
        } else {
            const oldTitle = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('videoTitle.txt', vidID)}/videoTitle.txt`, {encoding:'utf-8'})
            if (oldTitle!=videoMetadata['snippet']['title']) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoTitle.txt`, videoMetadata['snippet']['title'])
                changes['title'] = true
            }
        }
    
        // Store description to revision if necessary
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoDescription.txt`, videoMetadata['snippet']['description'])
        } else {
            const oldDescription = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('videoDescription.txt', vidID)}/videoDescription.txt`, {encoding:'utf-8'})
            if (oldDescription!=videoMetadata['snippet']['description']) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoDescription.txt`, videoMetadata['snippet']['description'])
                changes['description'] = true
            }
        }
    
        // Store license and playability details if necessary
        const licenseAndPlayability  = {
            "embeddable":videoMetadata['status']['embeddable'],
            "publicStatsViewable":videoMetadata['status']['publicStatsViewable'],
            "licensed":videoMetadata['contentDetails']['licensedContent'],
            "contentRating":videoMetadata['contentDetails']['contentRating'],
            "license":videoMetadata['status']['license']??'__YTARCHIVE_UNLICENSED',
            "madeForKids":videoMetadata['status']['madeForKids'],
            "geoblockedRegions":(videoMetadata['contentDetails']['regionRestriction']?videoMetadata['contentDetails']['regionRestriction']['blocked']:null)??[]
        }
    
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/licenseAndRegulation.json`, JSON.stringify(licenseAndPlayability))
        } else {
            const oldLicenseAndPlayabilityData = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('licenseAndRegulation.json', vidID)}/licenseAndRegulation.json`, {encoding:'utf-8'})
            if (oldLicenseAndPlayabilityData != JSON.stringify(licenseAndPlayability)) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/licenseAndRegulation.json`, JSON.stringify(licenseAndPlayability))
                changes['regulation'] = true
            }
        }
    
        // Store video quality and features info if necessary
        const videoQualityInfo = {
            "duration":Duration.fromISO(videoMetadata['contentDetails']['duration']).as('seconds'),
            "definition":videoMetadata['contentDetails']['definition'],
            "dimension":videoMetadata['contentDetails']['dimension'],
            "caption":videoMetadata['contentDetails']['caption'],
            "defaultAudioLanguage":videoMetadata['snippet']['defaultAudioLangauge'],
            "projection":videoMetadata['contentDetails']['projection']
        }
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoQualityDetails.json`, JSON.stringify(videoQualityInfo))
        } else {
            const oldVideoQualityInfo = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('videoQualityDetails.json', vidID)}/videoQualityDetails.json`, {encoding:'utf-8'})
            if (oldVideoQualityInfo != JSON.stringify(videoQualityInfo)) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/videoQualityDetails.json`, JSON.stringify(videoQualityInfo))
                changes['videoFeaturesData'] = true
            }
        }
    
        // Store likes if necessary
        const videoLikes = String(videoMetadata['statistics']['likeCount'])
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/statistics/likes.txt`, videoLikes)
        } else {
            const oldLikes = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('statistics/likes.txt', vidID)}/statistics/likes.txt`, {encoding:'utf-8'})
            if (oldLikes != videoLikes) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/statistics/likes.txt`, videoLikes)
                changes['stats']['likes'] = true
            }
        }
    
        // Store views if necessary
        const videoViews = String(videoMetadata['statistics']['viewCount'])
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/statistics/views.txt`, videoViews)
        } else {
            const oldVideoViews = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('statistics/views.txt', vidID)}/statistics/views.txt`, {encoding:'utf-8'})
            if (oldVideoViews != videoViews) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/statistics/views.txt`, videoViews)
                changes['stats']['views'] = true
            }
        }
    
        // Store comments if neccesary
        const videoComments = String(videoMetadata['statistics']['commentCount'])
        if (OGIndex) {
            fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/statistics/comments.txt`, videoComments)
        } else {
            const oldLikes = fs.readFileSync(`./serverResources/videos/${vidID}/${getVideoRevisionWith('statistics/comments.txt', vidID)}/statistics/comments.txt`, {encoding:'utf-8'})
            if (oldLikes != videoComments) {
                fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/statistics/comments.txt`, videoComments)
                changes['stats']['likes'] = true
            }
        }
    
        // Wait for video download, and then compare. Throw an error if not finished successfully
        if ((await Promise.all([videoDownload]))[0] != "S") {
            throw Error((await Promise.all([videoDownload]))[0])
        }
        if (!OGIndex) {
            if (sha256File(`./serverResources/videos/${vidID}/${revID}/video.mp4`) != sha256File(`./serverResources/videos/${vidID}/${getVideoRevisionWith('video.mp4', vidID)}/video.mp4`)) {
                changes['videoFile'] = true
            } else {
                fs.unlinkSync(`./serverResources/videos/${vidID}/${revID}/video.mp4`)
            }
        }
    
        // Save changes.json
        fs.writeFileSync(`./serverResources/videos/${vidID}/${revID}/changes.json`, JSON.stringify(changes))
    
        // Delete tmp folder
        fs.rmSync(`./serverResources/videos/${vidID}/${revID}/tmp`, {recursive:true,force:true})
    
        // Delete everything if there are no changes
        if (!OGIndex) {
            const noChanges = JSON.stringify({
                "constants": {
                    "datePublished": false,
                    "channelID": false
                },
                "OGIndex": false,
                "thumbnail": false,
                "category": false,
                "tags": false,
                "title": false,
                "description": false,
                "regulation": false,
                "videoFeaturesData": false,
                "videoFile": false,
                "stats": {
                    "likes": false,
                    "views": false,
                    "comments": false
                }
            })
            if (noChanges === JSON.stringify(changes)) {
                fs.rmSync(`./serverResources/videos/${vidID}/${revID}`, {recursive:true})
            }
        }
        if (!fs.existsSync(`./serverResources/channels/${videoMetadata['snippet']['channelId']}`)) {
            await fetch('http://127.0.0.1:3000/channelIndex/'+videoMetadata['snippet']['channelId']+"?srx=indexVideo")
        }
        res.send(changes)

    } catch (e) {
        console.log(e)
        if (OGIndex) {
            if (channelID !== undefined) {
                fs.unlinkSync("./serverResources/channelVideosIndex/"+channelID+"/"+req.params.videoID+".txt")
            }
            fs.rmSync("./serverResources/videos/"+req.params.videoID,{recursive:true,force:true})
        }
        fs.rmSync("./serverResources/videos/"+req.params.videoID+"/"+revID,{recursive:true, force:true})
        res.send(`EIndexFailed\n${e}`)
        return
    }
})

module.exports = indexVideoRouter;