import { Tag } from "../../logging/logging"
import { promises as fs } from 'node:fs'  // Use fs.promises for async file operations
import path from 'path'
import child_process from 'node:child_process'

const ytCountries: Array<string> = ["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"]
const range = (start: number, end: number, step: number = 1) => Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step);

async function downloadURLInChunks(url: string, outputFile: string, downloadContentSizeBytes: number, chunkSizeBytes: number = 10_000_000, t: Tag): Promise<string | boolean> {
    for (const startPosition of range(0, downloadContentSizeBytes, chunkSizeBytes)) {
        const endPosition = Math.min(startPosition + chunkSizeBytes - 1, downloadContentSizeBytes - 1); // Ensure we don't download more than what's available in the file
        try {
            const response = await fetch(url, { method: 'GET', headers: { 'Range': `bytes=${startPosition}-${endPosition}` } });
            const responseBinary = await response.arrayBuffer();

            if (response.status === 206) { // 206 Partial Content
                await fs.writeFile(outputFile, Buffer.from(responseBinary), { flag: 'a' }); // Append mode
                console.log(`${t.tag}Successfully wrote chunk ${startPosition} to ${endPosition} out of ${downloadContentSizeBytes} (${+((endPosition / downloadContentSizeBytes) * 100).toFixed(2)}%)...`);
            } else {
                console.log(`${t.tag}Recieved Status ${response.statusText} From Server! Content: "${await response.text()}"`);
                return `EReceived Status ${response.statusText} From Server!`;
            }
        } catch (err) {
            if (err instanceof Error) {
                return `EError occurred: ${err.message}`;
            } else {
                return `EUnknown error occurred`;
            }
        }
    }
    return "S";
}

export async function downloadVideo(id: string, filePath: string, tempFolder: string) {
    try {
        // Part 1: Fetch and parse the initial YT server response
        const t = new Tag("YouTube Video Downloader", [`VID: ${id}`]);
        const ytRequest: Response = await fetch("https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w?prettyPrint=false", {
            method: 'POST',
            headers: {
                'User-Agent': 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)'
            },
            body: JSON.stringify({
                "videoId": id,
                "context": {
                    "client": {
                        "clientName": "IOS",
                        "clientVersion": "19.29.1",
                        "deviceMake":"Apple",
                        "deviceModel":"iPhone16,2",
                        "osName":"iPhone",
                        "osVersion":"17.5.1.21F90",
                        "timeZone":"UTC",
                        "userAgent":"com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)",
                        "hl": "en",
                        "gl": "IS", // Choosing Iceland to avoid censorship
                        "utcOffsetMinutes": 0
                    }
                },
                "playbackContext": {
                    "contentPlaybackContext": {
                        "autoCaptionsDefaultOn": true
                    }
                }
            })
        });
    
        if (ytRequest.status !== 200) {
            console.log(`${t.tag}Server returned status ${ytRequest.status}!`);
            return `Server returned status ${ytRequest.status}! Response:\n${await ytRequest.text()}`;
        }
        const ytResponse: any = await ytRequest.json()
        
        console.log(`${t.tag}Fetched and parsed server response!`);
    
        // Part 2: Check the video's playability status
        console.log(`${t.tag}Playability Status is ${ytResponse.playabilityStatus.status}!`);
        if (ytResponse.playabilityStatus.status !== 'OK') {
            return `EVideo unplayable: ${ytResponse.playabilityStatus.reason}`;
        }
    
        // Part 2.1: Make sure video is not a live stream
        if (ytResponse['videoDetails']['isLive']) {
            return 'EVideoLive'
        }

        // Part 3: Organize DASH streams
        const DASHStreams = Array.from(ytResponse.streamingData.adaptiveFormats);
        let DashStreamsVideo: Record<number, any> = {};
        let DashStreamsAudio: Record<number, any> = {};
    
        for (const __DASHStreamData of DASHStreams) {
            const DASHStreamData = __DASHStreamData as any;
    
            if (DASHStreamData.mimeType.indexOf("video/") !== -1) {
                const resolutionScore: number = (DASHStreamData["height"] as number * DASHStreamData["width"] as number * DASHStreamData["fps"] as number) / 1000;
                const headersData: any | null = await fetch(DASHStreamData.url, { method: "HEAD" });
    
                console.log(`${t.tag}Video Stream Detected! Resolution Score: ${resolutionScore}; Content Length: ${headersData.headers.get("Content-Length")}; Content Type: ${headersData.headers.get("Content-Type")}`);
    
                DASHStreamData["__YTARCHIVE_FILE_EXTENSION"] = headersData.headers.get("Content-Type").split("/")[1];
                DASHStreamData["__YTARCHIVE_FILE_SIZE_BYTES"] = headersData.headers.get("Content-Length") as number;
                DashStreamsVideo[resolutionScore] = DASHStreamData;
            } else if (DASHStreamData.mimeType.indexOf("audio/") !== -1) {
                const resolutionScore: number = (DASHStreamData["approxDurationMs"] as number * DASHStreamData["audioSampleRate"] as number * DASHStreamData["averageBitrate"] as number * DASHStreamData["audioChannels"] as number) / 10000;
                const headersData: any | null = await fetch(DASHStreamData.url, { method: "HEAD" });
    
                console.log(`${t.tag}Audio Stream Detected! Resolution Score: ${resolutionScore}; Content Length: ${headersData.headers.get("Content-Length")}; Content Type: ${headersData.headers.get("Content-Type")}`);
    
                DASHStreamData["__YTARCHIVE_FILE_EXTENSION"] = headersData.headers.get("Content-Type").split("/")[1];
                DASHStreamData["__YTARCHIVE_FILE_SIZE_BYTES"] = headersData.headers.get("Content-Length") as number;
                DashStreamsAudio[resolutionScore] = DASHStreamData;
            }
        }
    
        // Part 4: Find highest-quality DASH stream
        const largestVideoStreamKey = Math.max(...Object.keys(DashStreamsVideo).map(key => parseFloat(key)));
        const largestVideoStream = DashStreamsVideo[largestVideoStreamKey];
    
        const largestAudioStreamKey = Math.max(...Object.keys(DashStreamsAudio).map(key => parseFloat(key)));
        const largestAudioStream = DashStreamsAudio[largestAudioStreamKey];
    
        console.log(`${t.tag}Found Largest Streams!`);
    
        // Ensure the output path is valid
        const videoOutputPath = path.join(__dirname, '../../../../', tempFolder, `__video.${largestVideoStream['__YTARCHIVE_FILE_EXTENSION']}`);
        const audioOutputPath = path.join(__dirname, '../../../../', tempFolder, `__audio.${largestAudioStream['__YTARCHIVE_FILE_EXTENSION']}`);
    
        // Create directories if they don't exist
        await fs.mkdir(path.dirname(videoOutputPath), { recursive: true });
        await fs.mkdir(path.dirname(audioOutputPath), { recursive: true });
    
        // Part 5: Download audio stream in 10MB chunks to bypass rate limiting
        console.log(`${t.tag}Kicking off audio download!`);
        const audioDownload = downloadURLInChunks(largestAudioStream['url'], audioOutputPath, largestAudioStream["__YTARCHIVE_FILE_SIZE_BYTES"], 10_000_000, new Tag("YouTube Video Download: Audio Stream Download", [`VID: ${id}`]));
    
        // Part 6: Download video stream in 10MB chunks to bypass rate limiting
        console.log(`${t.tag}Kicking off video download!`);
        const videoDownload = downloadURLInChunks(largestVideoStream['url'], videoOutputPath, largestVideoStream["__YTARCHIVE_FILE_SIZE_BYTES"], 10_000_000, new Tag("YouTube Video Download: Video Stream Download", [`VID: ${id}`]));
    
        // Part 7: Wait for audio and video downloads to finish
        console.log(`${t.tag}Waiting for downloads to finish...`);

        const res = await Promise.all([audioDownload, videoDownload]);
        if (res[0] != "S") {return 'EADownload Failed:\n'+audioDownload}
        if (res[1] != "S") {return 'EVDownload Failed:\n'+videoDownload}

        console.log(`${t.tag}Downloads finished!`);
    
        // Part 8: Mix streams in FFMpeg
        console.log(`${t.tag}Mixing in FFMpeg...`)
        const ffmpegResult = child_process.spawnSync("ffmpeg", [
            "-i", videoOutputPath,
            "-i", audioOutputPath,
            "-c:a", "aac",
            "-c:v", "h264_nvenc",
            "-shortest",
            "-y",
            "-movflags", "+faststart",
            "-threads", "50",
            path.join(__dirname, '../../../../', filePath)
        ])
        console.log(`${t.tag}Mixed streams in FFMpeg and outputted to ${String(path.join(__dirname, '../../../../', filePath))}!`)
        if (ffmpegResult.status !== 0) {
            return "EFFMpeg Returned "+ffmpegResult.status+"!\n"+ffmpegResult.error
        }
        return "S"
    } catch (e: any) {
        return "EMiscError\n"+e.toString()
    }
}
