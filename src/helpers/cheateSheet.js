import * as XLSX from "xlsx";
import { logger } from "@oisamitech/sami-logger";

export function createSheet(data, sheetName) {
    try {
        let worksheet = XLSX.utils.json_to_sheet(data);
        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        let xlsxBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer",
        });

        return xlsxBuffer;
    } catch (error) {
        logger.error("Error creating spreadsheet", error);
        throw new Error("Failed to create spreadsheet: " + error.message);
    }
}