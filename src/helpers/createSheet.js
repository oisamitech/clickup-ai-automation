import * as XLSX from "xlsx";
import { logger } from "@oisamitech/sami-logger";

export function createSheet(lists) {
    try {
        let workbook = XLSX.utils.book_new();

        for (const list of lists) {
            let worksheet = XLSX.utils.json_to_sheet(list.tickets);
            XLSX.utils.book_append_sheet(workbook, worksheet, list.listName);
        }

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