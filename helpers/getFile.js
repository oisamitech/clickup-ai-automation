import fs from 'fs';
import path from 'path';

export default async function getFile(filename) {
    try {
        if (!filename) {
            throw new Error('Nome do arquivo é obrigatório');
        }

        // Criar o caminho para a pasta files
        const filesDir = path.join(process.cwd(), 'files');
        const filePath = path.join(filesDir, filename);

        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filename}`);
        }

        // Verificar se é um arquivo válido
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            throw new Error(`${filename} não é um arquivo válido`);
        }

        const data = fs.readFileSync(filePath, 'utf8');
        
        // Tentar fazer parse do JSON automaticamente
        let parsedData;
        try {       
            return JSON.parse(data);
        } catch (parseError) {
            return data;
        }
        
    } catch (error) {
        console.error('❌ Erro ao ler arquivo:', error.message);
        throw error;
    }
}