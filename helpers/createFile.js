import fs from 'fs';
import path from 'path';

export default async function createFile(data, filename) {
    try {
        // Criar o caminho para a pasta files
        const filesDir = path.join(process.cwd(), 'files');
        
        // Criar a pasta files se ela não existir
        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }
        
        // Caminho completo do arquivo
        const filePath = path.join(filesDir, filename);
        
        let filedata = JSON.stringify(data, null, 2);

        fs.writeFileSync(filePath, filedata);
        
        console.log(`✅ Arquivo criado com sucesso: ${filename}`);
        console.log(`📁 Localização: ${filePath}`);
        console.log(`📊 Total de registros: ${Array.isArray(data) ? data.length : 'N/A'}`);
        
        return `O arquivo ${filename} foi criado em ${filePath}!`
    } catch (error) {
        console.error('❌ Erro ao criar arquivo:', error.response?.data || error.message);
        throw error;
    }
}