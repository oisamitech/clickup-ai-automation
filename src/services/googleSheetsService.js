import { logger } from "@oisamitech/sami-logger";
import { google } from "googleapis";
import { version } from "xlsx";

export default class GoogleSheetsService {
    constructor () {
        this.auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
    }

    async createSpreadsheet(title, data, emails = []) {
        try {
            let createResponse = await this.sheets.spreadsheets.create({
                resource: {
                    properties: { title: title },
                    sheets: [{ properties: { title: 'Report' }}]
                }
            });
            let spreadsheetId = createResponse.data.spreadsheetId;
            let spreadsheetUrl = createResponse.data.spreadsheetUrl;
            console.log("GoogleSheetsService: Spreadsheet created with ID:", spreadsheetId);
            
            // Step 2: Move to specific folder if GOOGLE_DRIVE_FOLDER_ID is set
            if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
                console.log("GoogleSheetsService: Moving spreadsheet to folder:", process.env.GOOGLE_DRIVE_FOLDER_ID);
                
                // Get current parents
                let fileMetadata = await this.drive.files.get({
                    fileId: spreadsheetId,
                    fields: 'parents'
                });
                
                let previousParents = fileMetadata.data.parents.join(',');
                
                // Move to new folder
                await this.drive.files.update({
                    fileId: spreadsheetId,
                    addParents: process.env.GOOGLE_DRIVE_FOLDER_ID,
                    removeParents: previousParents,
                    fields: 'id, parents'
                });
                
                console.log("GoogleSheetsService: Spreadsheet moved to folder successfully");
            }

            if (data && data.length > 0) {
                let headers = Object.keys(data[0]);
                let values = [headers, ...data.map(item => headers.map(header => item[header] || ''))];


                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: 'Report!A1',
                    valueInputOption: 'RAW',
                    resource: { values: values }
                });
            }

            if (emails.length > 0) {
                for (let email of emails) {
                    await this.drive.permissions.create({
                        fileId: spreadsheetId,
                        resource: {
                            role: 'reader',
                            type: 'user',
                            emailAddress: email
                        }
                    });
                }
            }

            logger.info(`📊 Spreadsheet created and configured: ${title}`);
            
            return {
                success: true,
                spreadsheetId: spreadsheetId,
                spreadsheetUrl: spreadsheetUrl,
                title: title,
                totalRows: data ? data.length + 1 : 1,
                sharedWith: emails
            };
        } catch (error) {
            logger.error('Error creating spreadsheet with data:', error);
            throw error;
        }
    }
}