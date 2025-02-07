import expressLib, {Express, Request, Response, NextFunction} from 'express';
import path from 'path'
import { downloadVideo } from './tools/YTOps/downloadVideo/downloadYTVideo';
import { middlewareLogger } from './tools/logging/logging';
import cors from 'cors'

const app: Express = expressLib()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../serverResources/views'))

app.use(expressLib.static(path.join(__dirname, '../serverResources/static')))
app.use(middlewareLogger)
app.use(cors({origin:'https://www.youtube.com'}))

/*
=====================================
MARK: INDEX ROUTERS
=====================================
*/
const indexVideoRouter = require("./routes/indexVideo")
app.use("/index", indexVideoRouter)

const indexChannelPageRouter = require("./routes/channelIndex")
app.use("/channelIndex", indexChannelPageRouter)


/*
=====================================
MARK: GET ROUTERS FOR VIDEOS
=====================================
*/

const getVideoRevListRouter = require("./routes/getVideoRevList")
app.use("/get/videos/revlist",getVideoRevListRouter)

const getVideoRevInfoRouter = require("./routes/getVideoRevInfo")
app.use("/get/videos/revinfo",getVideoRevInfoRouter)

const getVideoFileRouter = require("./routes/getVideoFile")
app.use("/get/videos/file",getVideoFileRouter)

/*
=====================================
MARK: GET ROUTERS FOR CHANNELS
=====================================
*/

const getChannelSnippetRouter = require("./routes/getChannelSnippet")
app.use("/get/channels/snippet",getChannelSnippetRouter)

console.log("Listening on port 3000!")
app.listen(3000)