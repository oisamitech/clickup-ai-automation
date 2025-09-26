import * as XLSX from "xlsx";
import { logger } from "@oisamitech/sami-logger";

export function createSheet(lists) {
    try {
        let workbook = XLSX.utils.book_new();
    
        let allTicketsSheet = XLSX.utils.json_to_sheet(lists.flatMap(list => list.tickets));
        XLSX.utils.book_append_sheet(workbook, allTicketsSheet, 'Todos os chamados');

        for (const list of lists) {
            let worksheet = XLSX.utils.json_to_sheet(list.tickets);
            XLSX.utils.book_append_sheet(workbook, worksheet, list.listName);
        }

        return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    } catch (error) {
        logger.error("Error creating spreadsheet", error);
        throw new Error("Failed to create spreadsheet: " + error.message);
    }
}