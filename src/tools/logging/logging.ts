import { NextFunction, Request, Response } from "express";
import colors from 'colors'

function appendZeros(num: number|string, digits: number): string|null {
    num = num.toString()
    if (num.length > digits) { return num}
    else if (num.length === digits) {return num}
    else if (num.length < digits) {
        let newNum = num;
        while (newNum.length < digits) {
            newNum = '0' + newNum
        }
        return newNum
    }
    return null
}

export class Tag {
    origin: string;
    extraInfo: Array<string>;
    constructor(origin: string, extraInfo: Array<string>) {
        this.origin = origin
        this.extraInfo = extraInfo
    }
    get tag(): string {
        const dateObj: Date = new Date()
        let outputString: string = (dateObj.getMonth()+1).toString() +
            '/' + appendZeros(dateObj.getDate(), 2) +
            '/' + dateObj.getFullYear().toString() + ' ' +
            appendZeros(dateObj.getHours(),2) +
            ':' + appendZeros(dateObj.getMinutes(), 2) +
            ':' + appendZeros(dateObj.getSeconds(), 2) +
            ':' + appendZeros(dateObj.getMilliseconds(), 4);
        
        outputString += ' -> '
        outputString += colors.italic(`[${this.origin}]`)

        outputString = colors.dim(outputString)
        outputString += colors.gray(` [${this.extraInfo.join("; ")}] `)
        return outputString
    }
}

/* Deprecated: getTag(...)
export function getTag(origin: string, extraInfo: Array<string>): string {
    const dateObj: Date = new Date()
    let outputString: string = dateObj.getMonth().toString() +
        '/' + appendZeros(dateObj.getDate(), 2) +
        '/' + dateObj.getFullYear().toString() + ' ' +
        appendZeros(dateObj.getHours(),2) +
        ':' + appendZeros(dateObj.getMinutes(), 2) +
        ':' + appendZeros(dateObj.getSeconds(), 2) +
        ':' + appendZeros(dateObj.getMilliseconds(), 4);
    
    outputString += ' -> '
    outputString += colors.italic(`[${origin}]`)

    outputString = colors.dim(outputString)
    outputString += colors.gray(` [${extraInfo.join("; ")}] `)
    return outputString
}
*/

export function middlewareLogger(req: Request, res: Response, next: NextFunction) {
    const t = new Tag('Middleware Logger',[req.socket.remoteAddress===undefined?'N/A':req.socket.remoteAddress.toString()])
    console.log(
        t.tag +
        colors.bold.blue(req.method) + ' request for ' +
        colors.green(req.originalUrl) + ' (HTTP/' + req.httpVersion + ')'
    )
    next()
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
export function makeId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}