import expressLib, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs'

export const getVideoRevList = expressLib.Router();

getVideoRevList.get("/:vidID",(req,res) => {
    const result: Record<string,object> = {}
    const vID = req.params.vidID
    if (fs.existsSync(`./serverResources/videos/${vID}`)) {
        const revIDs = fs.readdirSync(`./serverResources/videos/${vID}`)
        revIDs.forEach(revID => {
            if (revID != "constants") {
                result[revID] = JSON.parse(fs.readFileSync(`./serverResources/videos/${vID}/${revID}/changes.json`,{encoding:'utf-8'}))
            }
        });
        res.send(result)
    } else {
        res.send('EInvalidVID')
    }
})

module.exports = getVideoRevList;