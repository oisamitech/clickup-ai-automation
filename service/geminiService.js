import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import { parseGeminiResponse } from "../helpers/parseGeminiResponse.js";

export default class GeminiService {
    constructor () {
        this.modelName = process.env.GEMINI_MODEL;
        this.googleGenAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    async categorizeTicket(ticket, historicalFiles) {
        try {
            // Criar o prompt específico para categorização (agora inline)
            const prompt = `
Você é um analista de suporte especializado em categorização automática de chamados. Sua tarefa é analisar um novo chamado e atribuir prioridade, UMA ÚNICA TAG, squad, origem e responsáveis baseado no histórico de chamados similares.

## CONTEXTO:
- Você trabalha em um sistema de suporte que usa ClickUp
- Os chamados vêm via formulário e precisam ser categorizados automaticamente
- Você tem acesso ao histórico de chamados anteriores para basear suas decisões
- **IMPORTANTE: Cada chamado deve receber APENAS UMA TAG**
- **A TAG RETORNADA DEVE SER OBRIGATORIAMENTE UMA TAG QUE JÁ FOI USADA EM ALGUM DOS CHAMADOS DO HISTÓRICO**
- **VOCÊ DEVE ANALISAR TODOS OS CASOS DO HISTÓRICO E ESCOLHER O CASO MAIS SIMILAR PARA DEFINIR A MELHOR TAG E PRIORIDADE PARA O NOVO CHAMADO**

## NOVO CHAMADO PARA CATEGORIZAR:
${JSON.stringify(ticket, null, 2)}

## HISTÓRICO DE CHAMADOS:
${JSON.stringify(historicalFiles.slice(0, 50), null, 2)}

## INSTRUÇÕES:
1. Analise o novo chamado (nome, descrição, tags existentes)
2. Compare com o histórico de chamados, buscando casos com títulos e descrições similares ou parecidos
3. Analise TODOS os casos do histórico e escolha o caso mais similar ao novo chamado
4. Baseie a prioridade, tag, squad, origem e responsáveis do novo chamado no caso mais similar encontrado
5. Considere a urgência baseada no conteúdo e contexto
6. **Se o chamado for sobre falta de acesso de um membro, classifique como prioridade 1 (urgente)**
7. **Selecione APENAS UMA TAG** que melhor represente o tipo do chamado, e que já tenha sido usada em algum chamado do histórico
8. **Para squad, origin e assignees, use APENAS valores que já existam no histórico de chamados**. Não invente valores novos.
9. **Para assignees**, selecione os mesmos responsáveis do caso similar do histórico

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
  "assignees": [
    {
      "id": "number",
      "username": "string"
    }
  ],
  "reasoning": "Breve explicação da categorização baseada no histórico",
  "confidence": 0.1-1.0
}

## EXEMPLO DE RESPOSTA VÁLIDA:
{
  "priority": 2,
  "tags": [
    {
      "name": "bug",
      "tag_fg": "#1b5e20",
      "tag_bg": "#1b5e20",
      "creator": 49170554
    }
  ],
  "squad": {
    "field_id": "c2d77207-eed4-4eef-a54f-34c620ee8adc",
    "value": 1,
    "option": {
      "id": "c42f0f72-2b75-43e1-8aa1-facdeea146e9",
      "name": "Sinistro",
      "color": null,
      "orderindex": 1
    }
  },
  "origin": {
    "field_id": "b521ca7d-610b-4044-8b22-fc5c0bbe6775",
    "value": 6,
    "option": {
      "id": "aa771d3d-8195-4c88-bbe9-0af9ea989c0b",
      "name": "health-declaration-api",
      "color": "#04A9F4",
      "orderindex": 6
    }
  },
  "assignees": [
    {
      "id": 49075005,
      "username": "Aline Farias de Sobral"
    }
  ],
  "reasoning": "Problema similar ao histórico mostra que erros de login são tratados como alta prioridade, e o time de Sinistro é o responsável por este tipo de chamado.",
  "confidence": 0.85
}

## REGRAS IMPORTANTES:
- NÃO use markdown (blocos de código)
- NÃO adicione texto antes ou depois do JSON
- NÃO use aspas simples, apenas aspas duplas
- Use APENAS UMA TAG no array "tags"
- O JSON deve ser válido e bem formatado
- Responda APENAS com o JSON, nada mais
`;
                       
            const response = await this.googleGenAi.models.generateContent({
                model: this.modelName,
                contents: prompt
            });

            return parseGeminiResponse(response.text);
            
        } catch (error) {
            console.error('❌ Erro na categorização:', error.message);
            throw error;
        }
    }

}