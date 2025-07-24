import fs from 'fs';
import path from 'path';
import getFile from './getFile.js';

export default async function getFiles() {
    try {
        const filesDir = path.join(process.cwd(), 'files');
        
        // Verificar se a pasta existe
        if (!fs.existsSync(filesDir)) {
            return [];
        }

        const files = fs.readdirSync(filesDir, { withFileTypes: true });
        const jsonFiles = files.filter(file => file.isFile() && file.name.endsWith('.json'));

        const parsedFiles = await Promise.all(
            jsonFiles.map(async (file) => {
                try {
                    const data = await getFile(file.name);
                    return data;
                } catch (error) {
                    console.error(`❌ Erro ao processar arquivo ${file.name}:`, error.message);
                    return null;
                }
            })
        );

        // Filtrar arquivos que falharam
        const validFiles = parsedFiles.filter(file => file !== null);
        
        return validFiles;
        
    } catch (error) {
        console.error('❌ Erro ao ler diretório:', error.message);
        throw error;
    }
}