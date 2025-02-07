import { createHash } from 'crypto'
import fs from "fs";

/**
 * Computes the SHA-256 hash of a file.
 * @param {string} filePath - Path to the file.
 * @returns {string} - The SHA-256 hash of the file in hexadecimal format.
 */
export function sha256File(filePath: string): string {
    try {
        // Read the file content synchronously
        const fileBuffer = fs.readFileSync(filePath);

        // Create a SHA-256 hash instance
        const hash = createHash('sha256');

        // Update the hash with the file content
        hash.update(fileBuffer);

        // Calculate the hash digest in hexadecimal format
        const hashDigest = hash.digest('hex');

        return hashDigest;
    } catch (error) {
        throw error;
    }
}

export async function computeHashFromUrl(fileUrl:string):Promise<string> {
    try {
        // Fetch the content from the URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data = Buffer.from(await response.arrayBuffer());

        // Create a SHA-256 hash of the content
        const hash = createHash('sha256');
        hash.update(data);
        const sha256Hash = hash.digest('hex');

        return sha256Hash
    } catch (error: any) {
        console.error(`Error fetching the URL: ${error.message}`);
    }
    return "E"
}

module.exports = {
    computeHashFromUrl: computeHashFromUrl,
    sha256File: sha256File
}