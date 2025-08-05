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
            // Create specific prompt for categorization 
            let prompt = `
Você é um analista de suporte especializado em categorização automática de chamados. Sua tarefa é analisar um novo chamado e atribuir prioridade, UMA ÚNICA TAG, squad, origem e responsáveis baseado no histórico de chamados similares.

## CONTEXTO:
- Você trabalha em um sistema de suporte que usa ClickUp
- Os chamados vêm via formulário e precisam ser categorizados automaticamente
- Você tem acesso ao histórico de chamados anteriores para basear suas decisões
- **IMPORTANTE: Cada chamado deve receber APENAS UMA TAG**
- **A TAG RETORNADA DEVE SER OBRIGATORIAMENTE UMA TAG QUE JÁ FOI USADA EM ALGUM DOS CHAMADOS DO HISTÓRICO**
- **VOCÊ DEVE COMPREENDER PROFUNDAMENTE O CONTEÚDO DO NOVO CHAMADO** - analise título, descrição, contexto e qualquer informação relevante
- **COMPARE O CONTEÚDO COM O HISTÓRICO BUSCANDO CASOS VERDADEIRAMENTE SIMILARES** - não se baseie apenas em palavras-chave, mas na essência do problema
- **OS CASOS DO HISTÓRICO USADOS COMO BASE DEVEM SER GENUINAMENTE SIMILARES** - mesmo tipo de problema, contexto parecido, não apenas tags em comum
- **SE NÃO ENCONTRAR CASOS VERDADEIRAMENTE SIMILARES NO HISTÓRICO, RETORNE NULL** - é melhor não categorizar do que categorizar incorretamente

## NOVO CHAMADO PARA CATEGORIZAR:
${JSON.stringify(ticket, null, 2)}

## HISTÓRICO DE CHAMADOS:
${JSON.stringify(historicalFiles.slice(0, 50), null, 2)}

## INSTRUÇÕES:
1. **COMPREENDA PROFUNDAMENTE** o novo chamado - analise título, descrição, contexto, tipo de problema
2. **COMPARE A ESSÊNCIA DO PROBLEMA** com o histórico de chamados, não apenas palavras-chave superficiais
3. **BUSQUE CASOS VERDADEIRAMENTE SIMILARES** - mesmo tipo de problema, contexto parecido, mesma natureza
4. **SE ENCONTRAR CASOS GENUINAMENTE SIMILARES PARA TODOS OS CAMPOS**, baseie a categorização completa no caso mais similar
5. **SE ENCONTRAR CASOS SIMILARES APENAS PARA ALGUNS CAMPOS**, categorize apenas esses campos e deixe os outros como null
6. **SE NÃO ENCONTRAR NENHUM CASO VERDADEIRAMENTE SIMILAR**, retorne "null" - é melhor não categorizar
7. Considere a urgência baseada no conteúdo e contexto
8. **Se o chamado for sobre falta de acesso de um membro, classifique como prioridade 1 (urgente)**
9. **Selecione APENAS UMA TAG** que melhor represente o tipo do chamado, e que já tenha sido usada em algum chamado do histórico
10. **Para squad, origin e assignees, use APENAS valores que já existam no histórico de chamados**. Não invente valores novos.
11. **Para assignees**, selecione os mesmos responsáveis do caso similar do histórico

## FORMATO DE RESPOSTA OBRIGATÓRIO:
Você DEVE responder APENAS com um JSON válido, sem nenhum texto adicional, markdown ou explicações.

**OPÇÃO 1 - SE ENCONTRAR CASOS VERDADEIRAMENTE SIMILARES PARA TODOS OS CAMPOS**, use a estrutura completa
**OPÇÃO 2 - SE ENCONTRAR CASOS SIMILARES APENAS PARA ALGUNS CAMPOS**, use a estrutura com campos null onde não houver similaridade
**OPÇÃO 3 - SE NÃO ENCONTRAR NENHUM CASO SIMILAR**, retorne apenas: "null"

Estrutura exata para casos similares:
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

## EXEMPLOS DE RESPOSTA VÁLIDA:

### Exemplo 1 - Categorização completa (quando há casos similares para todos os campos):
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

### Exemplo 2 - Categorização parcial (quando alguns campos não têm casos similares no histórico):
{
  "priority": 3,
  "tags": [
    {
      "name": "bug",
      "tag_fg": "#1b5e20",
      "tag_bg": "#1b5e20",
      "creator": 49170554
    }
  ],
  "squad": null,
  "origin": null,
  "assignees": null,
  "reasoning": "Encontrei casos similares para classificar como dúvida e definir prioridade, mas não há casos similares no histórico para determinar squad, origem ou responsáveis específicos.",
  "confidence": 0.60
}

## REGRAS IMPORTANTES:
- **SE NÃO ENCONTRAR NENHUM CASO SIMILAR NO HISTÓRICO, retorne apenas "null"**
- **SE ENCONTRAR CASOS SIMILARES PARA ALGUNS CAMPOS, retorne o JSON com os campos encontrados preenchidos e os campos sem similaridade como null**
- **CAMPOS INDIVIDUAIS PODEM SER null SE NÃO HOUVER CASOS SIMILARES PARA AQUELE CAMPO ESPECÍFICO**
- **Para campos null, use exatamente: null (sem aspas)**
- NÃO use markdown (blocos de código)
- NÃO adicione texto antes ou depois do JSON/null
- NÃO use aspas simples, apenas aspas duplas
- Use APENAS UMA TAG no array "tags"
- O JSON deve ser válido e bem formatado
- Responda APENAS com o JSON ou "null", nada mais
- **PRIORIZE QUALIDADE SOBRE QUANTIDADE** - é melhor não categorizar do que categorizar errado
`;
                       
            const response = await this.googleGenAi.models.generateContent({
                model: this.modelName,
                contents: prompt
            });

            return parseGeminiResponse(response.text);
            
        } catch (error) {
            console.error('Error in categorization:', error.message);
            throw error;
        }
    }

}