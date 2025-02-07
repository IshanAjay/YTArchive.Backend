import expressLib, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs'

import { getChannelRevisionWith } from '../tools/searchingTools';

export const getChannelSnippet = expressLib.Router()


function getChannelRevisionWith_beforeCertainRevision(file:string,channelID:string,beforeRevID:string) {
    const revisionList: Array<number> = fs.readdirSync(`./serverResources/channels/${channelID}`,{withFileTypes:true})
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
    console.log(res)
    return getChannelRevisionWith(file,channelID,false,["constants","tmp",...res])
}

getChannelSnippet.get("/:channelID",(req,res) => {
    const result = {"revIDShown":"N/A","channelPFP":"","stats":{"views":"","subscribers":"","videos":""},"channelName":""}

    const cID = req.params.channelID
    const revID: string = (req.query.revID??"__ERR") as string

    if ((revID.charAt(0) != 'R')&&(revID==="__ERR")) {
        res.send("ENoRevID")
        return
    }
    if (!fs.existsSync(`./serverResources/channels/${cID}`)) {
        res.send("EChannelNonExistent")
        return
    }

    switch (revID.charAt(0)) {
        case 'R':{ // Get newest revision
            const channelRevIDs = fs.readdirSync(`./serverResources/channels/${cID}`, {withFileTypes:true}) // List of numbers of revision IDs
                .filter(fsDirEntry=>fsDirEntry.isDirectory())
                .map(fsDirectory=>Number(fsDirectory.name))
                .sort() // Sort ascending
                .reverse() // We want to sort descending, so we reverse the ascending array

            result['revIDShown'] = String(channelRevIDs[0])

            result['channelPFP'] = Buffer.from(fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelProfilePicture.jpeg",cID,String(channelRevIDs[0]))}/channelProfilePicture.jpeg`)).toString("base64")
            result['stats']['subscribers'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/subscribers.txt",cID,String(channelRevIDs[0]))}/stats/subscribers.txt`,{encoding:"utf-8"})
            result['stats']['videos'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/videos.txt",cID,String(channelRevIDs[0]))}/stats/videos.txt`,{encoding:"utf-8"})
            result['stats']['views'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/views.txt",cID,String(channelRevIDs[0]))}/stats/views.txt`,{encoding:"utf-8"})
            result['channelName'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelTitle.txt",cID,String(channelRevIDs[0]))}/channelTitle.txt`,{encoding:"utf-8"})
            break
        }
        
        case 'O':{ // Get oldest revision
            const channelRevIDs = fs.readdirSync(`./serverResources/channels/${cID}`, {withFileTypes:true}) // List of numbers of revision IDs
                .filter(fsDirEntry=>fsDirEntry.isDirectory())
                .map(fsDirectory=>Number(fsDirectory.name))
                .sort() // Sort ascending
                .reverse() // We want to sort descending, so we reverse the ascending array

            result['revIDShown'] = String(channelRevIDs[0])

            result['channelPFP'] = Buffer.from(fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelProfilePicture.jpeg",cID,String(channelRevIDs[0]))}/channelProfilePicture.jpeg`)).toString("base64")
            result['stats']['subscribers'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/subscribers.txt",cID,String(channelRevIDs[0]))}/stats/subscribers.txt`,{encoding:"utf-8"})
            result['stats']['videos'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/videos.txt",cID,String(channelRevIDs[0]))}/stats/videos.txt`,{encoding:"utf-8"})
            result['stats']['views'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/views.txt",cID,String(channelRevIDs[0]))}/stats/views.txt`,{encoding:"utf-8"})
            result['channelName'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelTitle.txt",cID,String(channelRevIDs[0]))}/channelTitle.txt`,{encoding:"utf-8"})
            break
        }

        case 'C':{ // Get closest revision to...
            const closestToRevID = revID.slice(1)
            const channelRevIDs = fs.readdirSync(`./serverResources/channels/${cID}`, {withFileTypes:true}) // List of numbers of revision IDs
                .filter(fsDirEntry=>fsDirEntry.isDirectory())
                .map(fsDirectory=>Number(fsDirectory.name))
            
            const differences: Record<number,number> = {}
            channelRevIDs.forEach(channelRevID => {
                differences[Math.abs(Number(closestToRevID) - Number(channelRevID))] = channelRevID
            });

            const closestToRevIDResult = differences[Object.keys(differences).map(Number).sort((a: any, b: any) => parseInt(a) - parseInt(b))[0]]
            result['revIDShown'] = String(closestToRevIDResult)
            result['channelPFP'] = Buffer.from(fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelProfilePicture.jpeg",cID,String(closestToRevIDResult))}/channelProfilePicture.jpeg`)).toString("base64")
            result['stats']['subscribers'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/subscribers.txt",cID,String(closestToRevIDResult))}/stats/subscribers.txt`,{encoding:"utf-8"})
            result['stats']['videos'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/videos.txt",cID,String(closestToRevIDResult))}/stats/videos.txt`,{encoding:"utf-8"})
            result['stats']['views'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/views.txt",cID,String(closestToRevIDResult))}/stats/views.txt`,{encoding:"utf-8"})
            result['channelName'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelTitle.txt",cID,String(closestToRevIDResult))}/channelTitle.txt`,{encoding:"utf-8"})

            break
        }
        
        default:{ // Get specific revision
            if (!fs.existsSync(`./serverResources/channels/${cID}/${revID}`)) {
                res.send("ERevNonExistent")
                return
            }
            
            // Channel PFP Data
            const channelPFPRevision = getChannelRevisionWith_beforeCertainRevision("channelProfilePicture.jpeg",cID,revID)
            if (channelPFPRevision==null) {
                res.send("ERevIDNotValid")
                return
            }
            result['channelPFP'] = Buffer.from(fs.readFileSync(`./serverResources/channels/${cID}/${channelPFPRevision}/channelProfilePicture.jpeg`)).toString("base64")
            
            result['stats']['subscribers'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/subscribers.txt",cID,revID)}/stats/subscribers.txt`,{encoding:"utf-8"})
            result['stats']['videos'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/videos.txt",cID,revID)}/stats/videos.txt`,{encoding:"utf-8"})
            result['stats']['views'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("stats/views.txt",cID,revID)}/stats/views.txt`,{encoding:"utf-8"})

            result['channelName'] = fs.readFileSync(`./serverResources/channels/${cID}/${getChannelRevisionWith_beforeCertainRevision("channelTitle.txt",cID,revID)}/channelTitle.txt`,{encoding:"utf-8"})
            
            break;
        }
    }
    
    res.send(result)
})

module.exports = getChannelSnippet