import fs from "fs";

/**
 * Given a file name, return the latest given revision ID for which that file was saved.
 * 
 * Returns a `string` if there was a revision found. If not, it will return `null`.
 * @param fileName The file name to return the latest given index for which it exist.
 * @param videoID The video ID to search.
 * @param excludeLatest *Currently not used*: Whether to exclude the latest revision from the search. Useful for revisions that are still in the process of being built.
 * @param excludeSubfolders List of folder names to exclude from the search. Useful for temporary folders. Default is `["constants", "tmp"]`
 */
export function getVideoRevisionWith(fileName: string, videoID: string, excludeLatest: boolean = false, excludeSubfolders: Array<string> = ["constants", "tmp"]): string | null {

    const revisionList: Array<number> =
        // Get all subfolders and subfiles of video directory
        fs.readdirSync(`./serverResources/videos/${videoID}`, { withFileTypes: true })
            // Keep only the subfolders. Also only keep the ones not specified in the `excludeSubfolders` array
            .filter(fileOrFolder => {
                if (fileOrFolder.isDirectory() && (excludeSubfolders.indexOf(fileOrFolder.name) === -1)) {
                    return true
                }
                return false
            })
            // Turn the folder object into just a string, with that string representing the folder name. Then, turn that into a Number
            .map(folder => Number(folder.name))
            // Sort the array ascending
            .sort()
            // We want the array sorted descending, so we need to reverse it
            .reverse()

    let res = null;
    revisionList.some(revID => {
        if (fs.existsSync(`./serverResources/videos/${videoID}/${revID}/${fileName}`)) {
            res = revID
            return true
        }
    })
    return String(res)
}

/**
 * Given a file name, return the latest given revision ID within a video for which that file was saved.
 * 
 * Returns a `string` if there was a revision found. If not, it will return `null`.
 * @param fileName The file name to return the latest given index for which it exist.
 * @param channelID The video ID to search.
 * @param excludeLatest *Currently not used*: Whether to exclude the latest revision from the search. Useful for revisions that are still in the process of being built.
 * @param excludeSubfolders List of folder names to exclude from the search. Useful for temporary folders. Default is `["constants"]`
 */
export function getChannelRevisionWith(fileName: string, channelID: string, excludeLatest: boolean = false, excludeSubfolders: Array<string> = []): string | null {

    const revisionList: Array<number> =
        // Get all subfolders and subfiles of video directory
        fs.readdirSync(`./serverResources/channels/${channelID}`, { withFileTypes: true })
            // Keep only the subfolders. Also only keep the ones not specified in the `excludeSubfolders` array
            .filter(fileOrFolder => {
                if (fileOrFolder.isDirectory() && (excludeSubfolders.indexOf(fileOrFolder.name) === -1)) {
                    return true
                }
                return false
            })
            // Turn the folder object into just a string, with that string representing the folder name. Then, turn that into a Number
            .map(folder => Number(folder.name))
            // Sort the array ascending
            .sort()
            // We want the array sorted descending, so we need to reverse it
            .reverse()

    let res = null;
    revisionList.some(revID => {
        if (fs.existsSync(`./serverResources/channels/${channelID}/${revID}/${fileName}`)) {
            res = revID
            return true
        }
    })
    return String(res)
}

module.exports = {
    getVideoRevisionWith:getVideoRevisionWith,
    getChannelRevisionWith:getChannelRevisionWith
}