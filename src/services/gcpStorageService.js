import { Storage } from '@google-cloud/storage';
import { logger } from "@oisamitech/sami-logger";

export default class GCPStorageService {
    constructor() {
        this.storage = new Storage({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        });
        
        this.bucket = this.storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
    }

    async uploadFile(data, filename) {
        try {
            const file = this.bucket.file(filename);
            
            const fileContent = typeof data === 'string' 
                ? data 
                : JSON.stringify(data, null, 2);
            
            await file.save(fileContent, {
                metadata: {
                    contentType: 'application/json'
                }
            });

            logger.info(`📤 File uploaded to GCP: ${filename}`);
            
            return {
                success: true,
                bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME,
                filename,
                size: Buffer.byteLength(fileContent, 'utf8')
            };

        } catch (error) {
            logger.error('Error uploading file to GCP:', error);
            throw error;
        }
    }

    async getAllFiles() {
        try {
            let [allFiles] = await this.bucket.getFiles();
            
            let files = await Promise.all(
                allFiles
                    .filter(file => file.name.endsWith('.json'))
                    .map(async (currentFile) => { 
                        let [content] = await currentFile.download();
                        let data = content.toString('utf8');
        
                        try {
                            return JSON.parse(data);
                        } catch (parseError) {
                            return null;
                        }
                    })
            );
            
            return files.filter(file => file !== null);
            
        } catch (error) {
            logger.error('Error listing files:', error);
            throw error;
        }
    }
}