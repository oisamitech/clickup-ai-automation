import { GoogleGenAI, Type } from "@google/genai";
import { parseGeminiResponse } from "../helpers/parseGeminiResponse.js";
import { logger } from "@oisamitech/sami-logger";

export default class GeminiService {
    constructor() {
        this.modelName = process.env.GEMINI_MODEL;
        this.googleGenAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    async categorizeTicket(ticket, historicalFiles) {
        try {
          let prompt = `
          Você é um analista de suporte especializado em categorização automática de chamados. Sua tarefa é analisar um novo chamado e atribuir prioridade, UMA ÚNICA TAG, squad, origem e responsáveis baseado no histórico de chamados similares.
          
          ## CONTEXTO:
          - Você trabalha em um sistema de suporte que usa ClickUp
          - Os chamados vêm via formulário e precisam ser categorizados automaticamente
          - Você tem acesso ao histórico de chamados anteriores para basear suas decisões
          - **IMPORTANTE: Cada chamado deve receber APENAS UMA TAG**
          - **A TAG RETORNADA DEVE SER OBRIGATORIAMENTE UMA TAG QUE JÁ FOI USADA EM ALGUM DOS CHAMADOS DO HISTÓRICO**
          - **SEMPRE PREENCHA O MÁXIMO DE CAMPOS POSSÍVEL**
          - **NÃO RETORNE NULL PARA SQUAD OU ORIGIN SE EXISTIR QUALQUER PADRÃO OU INDÍCIO NO HISTÓRICO**. Somente retorne null nesses campos se for ABSOLUTAMENTE impossível inferir um valor com base em qualquer evidência.
          - Para assignees, também evite null: se houver correspondência parcial ou padrão no histórico, use-o.
          - Para product, também evite null: se houver correspondência parcial ou padrão no histórico, use-o.

          ## NOVO CHAMADO PARA CATEGORIZAR:
          ${JSON.stringify(ticket, null, 2)}
          
          ## HISTÓRICO DE CHAMADOS:
          ${JSON.stringify(historicalFiles.slice(0, 50), null, 2)}
          
          ## INSTRUÇÕES:
          1. **COMPREENDA PROFUNDAMENTE** o novo chamado - analise título, descrição, contexto, tipo de problema
          2. **COMPARE A ESSÊNCIA DO PROBLEMA** com o histórico de chamados, não apenas palavras-chave superficiais
          3. **SEMPRE PREENCHA TODOS OS CAMPOS POSSÍVEIS**:
             - Se houver caso diretamente similar → use como base
             - Se houver similaridade parcial → complete os campos correspondentes e **INFERA OS OUTROS CAMPOS (squad, origin, assignees) COM BASE NOS PADRÕES DO HISTÓRICO**
             - Só use null se absolutamente não houver como deduzir
          4. **Para squad, origin e assignees, use APENAS valores que já existam no histórico de chamados**. Nunca invente valores novos.
          5. **DEFINIÇÃO DE URGÊNCIA (prioridade 1):**
             - Qualquer caso que **impeça o usuário de acessar o aplicativo**
             - Qualquer caso que **impeça o usuário de acessar o aplicativo**
             - Qualquer caso que **impeça o membro de estar no MV*
             - Qualquer caso que **envolva não refletiu**
             - Qualquer caso que **impeça o usuário de utilizar um serviço essencial**
             - Esses casos devem SEMPRE ser classificados como prioridade 1 (urgente)
          6. **Selecione APENAS UMA TAG** que melhor represente o tipo do chamado, e que já tenha sido usada em algum chamado do histórico
          7. Para assignees, selecione os mesmos responsáveis do caso similar ou do padrão identificado no histórico
          
          ## FORMATO DE RESPOSTA OBRIGATÓRIO:
          Você DEVE responder APENAS com um JSON válido, sem nenhum texto adicional, markdown ou explicações.
          
          Estrutura exata:
          {
            "priority": 1-4,
            "tags": [
              {
                "name": "nome_da_tag",
                "tag_fg": "#1b5e20",
                "tag_bg": "#1b5e20",
                "creator": 49170554
              }
            ],
            "squad": {
              "field_id": "string",
              "value": "number",
              "option": {
                "id": "string",
                "name": "string",
                "color": "string",
                "orderindex": "number"
              }
            },
            "origin": {
              "field_id": "string",
              "value": "number",
              "option": {
                "id": "string",
                "name": "string",
                "color": "string",
                "orderindex": "number"
              }
            },
            "product": {
              "field_id": "string",
              "value": "number",
              "option": {
                "id": "string",
                "name": "string",
                "color": "string",
                "orderindex": "number"
              }
            },  
            "assignees": [
              {
                "id": "number",
                "username": "string"
              }
            ],
            "reasoning": "Breve explicação da categorização baseada no histórico",
            "confidence": 0.1-1.0
          }
          
          ## REGRAS IMPORTANTES:
          - **NUNCA deixe squad ou origin como null se houver qualquer evidência no histórico que permita inferir o valor.**
          - **Preencha todos os campos possíveis**. Use null apenas quando não existir absolutamente nenhuma base no histórico.
          - **Qualquer caso que impeça o acesso ao app, pagamento ou uso de serviço essencial → prioridade 1**
          - **Use APENAS UMA TAG no array "tags"**
          - O JSON deve ser válido e bem formatado
          - Responda APENAS com o JSON ou "null", nada mais
          - **Prefira arriscar uma inferência baseada no histórico a retornar null em squad/origin**
          `;     
                       
            const response = await this.googleGenAi.models.generateContent({
                model: this.modelName,
                contents: prompt
            });

            return parseGeminiResponse(response.text);
            
        } catch (error) {
            logger.error('Error in categorization:', error.message);
            throw error;
        }
    }
}