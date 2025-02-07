import expressLib, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs'
import path from 'path'

import { getVideoRevisionWith } from '../tools/searchingTools';

export const getVideoRevInfo = expressLib.Router();

getVideoRevInfo.get("/:vidID",(req,res) => {
    const vID = req.params.vidID
    const revID = req.query.revID??"__ERR"
    if (revID==="__ERR") {
        res.send("ENoRevID")
        return
    }
    if (!fs.existsSync(`./serverResources/videos/${vID}`)) {
        res.send("EVideoNonExistent")
        return
    }
    if (!fs.existsSync(`./serverResources/videos/${vID}/${revID}`)) {
        res.send("ERevNonExistent")
        return
    }

    const videoPath = getVideoRevisionWith("video.mp4",vID)
    if (videoPath === null) {
        res.send("ERevIDNotValid")
        return
    }

    res.sendFile(path.resolve(`./serverResources/videos/${vID}/${videoPath}/video.mp4`))
    
})

module.exports = getVideoRevInfo;