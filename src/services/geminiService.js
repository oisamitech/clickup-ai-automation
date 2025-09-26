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
          - **OBRIGATÓRIO: SEMPRE CATEGORIZE O MÁXIMO POSSÍVEL - NUNCA DEIXE CAMPOS NULL SEM TENTAR ENCONTRAR CORRESPONDÊNCIA**
          - **SEMPRE PREENCHA TODOS OS CAMPOS POSSÍVEIS - USE O HISTÓRICO COMO BASE PARA INFERIR VALORES**

          ## NOVO CHAMADO PARA CATEGORIZAR:
          ${JSON.stringify(ticket, null, 2)}
          
          ## HISTÓRICO DE CHAMADOS:
          ${JSON.stringify(historicalFiles.slice(0, 50), null, 2)}
          
          ## INSTRUÇÕES CRÍTICAS:
          1. **ANALISE O PROBLEMA REAL**: Não se limite a palavras-chave - entenda a ESSÊNCIA do problema descrito
          2. **BUSQUE CASOS SIMILARES**: Procure no histórico por problemas do MESMO TIPO, mesmo que descritos de forma diferente
          3. **CATEGORIZE SEMPRE**: 
             - Se encontrar caso IDÊNTICO → use como base completa
             - Se encontrar caso SIMILAR → use como base e INFIRA os campos restantes
             - Se encontrar caso PARCIALMENTE SIMILAR → use os campos correspondentes e INFIRA os outros
             - Se encontrar PADRÃO no histórico → use o padrão identificado
             - **SÓ RETORNE NULL SE REALMENTE NÃO HOUVER NENHUM CASO SIMILAR NO HISTÓRICO**
          4. **INFIRA COM BASE NO HISTÓRICO**:
             - Squad: Se casos similares têm squad X, use squad X
             - Origin: Se casos similares têm origin Y, use origin Y  
             - Assignees: Se casos similares têm responsável Z, use responsável Z
             - Product: Se casos similares têm produto W, use produto W
          5. **DEFINIÇÃO DE PRIORIDADES (SEMPRE UM NÚMERO DE 1 A 4):**
             - **PRIORIDADE 1 (URGENTE)**: Qualquer caso que **impeça o usuário de acessar o aplicativo**
             - **PRIORIDADE 1 (URGENTE)**: Qualquer caso que **impeça o membro de estar no MV*
             - **PRIORIDADE 1 (URGENTE)**: Qualquer caso que **envolva não refletiu**
             - **PRIORIDADE 1 (URGENTE)**: Qualquer caso que **impeça o usuário de utilizar um serviço essencial (Slack, ClickUp, GCP e bancos de dados não entram nesse escopo)**
             - **IMPORTANTE: A PRIORIDADE DEVE SER SEMPRE UM NÚMERO (1, 2, 3 ou 4) - NUNCA TEXTO**
          6. **Selecione APENAS UMA TAG** que melhor represente o tipo do chamado, e que já tenha sido usada em algum chamado do histórico
          7. **USE O HISTÓRICO COMO REFERÊNCIA**: Para assignees, squad, origin e product, use APENAS valores que já existam no histórico de chamados
          
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
          
          ## REGRAS CRÍTICAS:
          - **OBRIGATÓRIO: SEMPRE TENTE CATEGORIZAR - NUNCA DEIXE CAMPOS NULL SEM TENTAR ENCONTRAR CORRESPONDÊNCIA NO HISTÓRICO**
          - **ANALISE A ESSÊNCIA DO PROBLEMA**: Mesmo que descrito diferente, se for o mesmo tipo de problema, use casos similares como base
          - **INFIRA SEMPRE**: Se houver qualquer evidência no histórico que permita inferir squad, origin, assignees ou product, INFIRA baseado nos padrões
          - **BUSQUE SIMILARIDADES**: Problemas iguais podem ser descritos de formas diferentes - encontre a similaridade e use como base
          - **PREFIRA INFERIR A RETORNAR NULL**: É melhor arriscar uma categorização baseada no histórico do que retornar null
          - **Qualquer caso que impeça o acesso ao app, pagamento ou uso de serviço essencial → prioridade 1**
          - **Use APENAS UMA TAG no array "tags"**
          - O JSON deve ser válido e bem formatado
          - Responda APENAS com o JSON ou "null", nada mais
          - **SÓ RETORNE NULL SE REALMENTE NÃO HOUVER NENHUM CASO SIMILAR NO HISTÓRICO COMPLETO**
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