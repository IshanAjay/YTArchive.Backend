import expressLib, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs'

import { getChannelRevisionWith, getVideoRevisionWith } from '../tools/searchingTools';

export const getVideoRevInfo = expressLib.Router();

function getVideoRevisionWith_beforeCertainRevision(file:string,vidID:string,beforeRevID:string) {
    const revisionList: Array<number> = fs.readdirSync(`./serverResources/videos/${vidID}`,{withFileTypes:true})
        // Keep only the folders
        .filter(entryObj=>{
            return (entryObj.isDirectory() && (['constants','tmp'].indexOf(entryObj.name) === -1))
        })
        .map(entryObj=>{return Number(entryObj.name)})

    const res: Array<string> = []
    revisionList.forEach(revisionID => {
        if (revisionID > Number(beforeRevID)) {
            res.push(String(revisionID))
        }
    });
    return getVideoRevisionWith(file,vidID,false,["constants","tmp",...res])
}

getVideoRevInfo.get("/:vidID",(req,res) => {
    const vID = req.params.vidID
    const revID: string = String(req.query.revID)??"__ERR"
    if (revID==="__ERR") {
        res.send("ENoRevID")
        return
    }

    if (!fs.existsSync(`./serverResources/videos/${vID}/${revID}`)) {
        res.send("ERevNonexistent")
        return
    }

    const result: Record<string,any> = {}
    const rootVideoDir = `./serverResources/videos/${vID}`

    // Stats
    result['statistics'] = {}
    //* (seems to be fixed) Issue where code only gives most recent revision. We should not be using the getVideoRevisionWith function here, rather a new function.
    
    result['statistics']['views'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('statistics/views.txt',vID,revID)}/statistics/views.txt`, {encoding:'utf-8'})
    result['statistics']['likes'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('statistics/likes.txt',vID,revID)}/statistics/likes.txt`, {encoding:'utf-8'})
    result['statistics']['comments'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('statistics/comments.txt',vID,revID)}/statistics/comments.txt`, {encoding:'utf-8'})

    // Category data
    result['categoryData'] = JSON.parse(fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('categoryID.json',vID,revID)}/categoryID.json`,{encoding:'utf-8'}))

    // Changes data
    result['changeData'] = JSON.parse(fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('changes.json',vID,revID)}/changes.json`,{encoding:'utf-8'}))

    // Regulation data
    result['licenseAndRegulation'] = JSON.parse(fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('licenseAndRegulation.json',vID,revID)}/licenseAndRegulation.json`,{encoding:'utf-8'}))

    // Thumbnail base64
    result['thumbnailBase64'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('thumbnail.jpeg',vID,revID)}/thumbnail.jpeg`).toString('base64')

    // Description
    result['description'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('videoDescription.txt',vID,revID)}/videoDescription.txt`, {encoding:'utf-8'})

    // Tags
    result['tags'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('videoTags.txt',vID,revID)}/videoTags.txt`, {encoding:'utf-8'})

    // Title
    result['title'] = fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('videoTitle.txt',vID,revID)}/videoTitle.txt`, {encoding:'utf-8'})

    // Quality Data
    result['videoEncodingAndQualityData'] = JSON.parse(fs.readFileSync(`${rootVideoDir}/${getVideoRevisionWith_beforeCertainRevision('videoQualityDetails.json',vID,revID)}/videoQualityDetails.json`,{encoding:'utf-8'}))

    // Constants
    result['constants'] = {}
    result['constants']['channelID'] = fs.readFileSync(`${rootVideoDir}/constants/channelID.txt`,{encoding:'utf-8'})
    result['constants']['datePublished'] = fs.readFileSync(`${rootVideoDir}/constants/datePublished.txt`,{encoding:'utf-8'})
    res.send(result)

})

module.exports = getVideoRevInfo;