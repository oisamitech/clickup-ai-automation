import { GoogleGenAI } from "@google/genai";
import { parseGeminiResponse } from "../helpers/parseGeminiResponse.js";

export default class GeminiService {
    constructor(logger = console) {
        this.logger = logger;
        this.modelName = process.env.GEMINI_MODEL;
        this.googleGenAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    async categorizeTicket(ticket, historicalFiles) {
        try {
            let prompt = `
Você é um analista de suporte especializado em categorização automática de chamados. Sua tarefa é analisar um novo chamado e atribuir prioridade, UMA ÚNICA TAG, squad, origem e responsáveis baseado no histórico de chamados similares.

## CONTEXTO DO SISTEMA:
- Sistema de suporte usando ClickUp para gestão de chamados
- Chamados chegam via formulário e precisam ser categorizados automaticamente
- Histórico de chamados anteriores serve como base para decisões
- **CRÍTICO**: Todas as tags, squads, origens e assignees DEVEM existir no histórico - NUNCA invente valores novos

## REGRAS DE CATEGORIZAÇÃO:
1. **ANÁLISE PROFUNDA**: Examine título, descrição, contexto e qualquer informação relevante do chamado
2. **SIMILARIDADE GENUÍNA**: Compare a essência do problema, não apenas palavras-chave superficiais
3. **CASOS VERDADEIRAMENTE SIMILARES**: Mesmo tipo de problema, contexto parecido, mesma natureza técnica
4. **RESTRIÇÃO DE TAGS**: A tag DEVE ser exatamente uma que já foi usada em algum chamado do histórico
5. **UMA TAG APENAS**: Selecione a tag mais representativa do problema principal
6. **VALORES PRÉ-EXISTENTES**: Para squad, origin e assignees, use APENAS valores do histórico
7. **RESPONSÁVEIS**: Para assignees, use os mesmos do caso mais similar encontrado

## CRITÉRIOS DE PRIORIDADE:
- **Prioridade 1 (Urgente)**: Falta de acesso de membros, sistemas críticos fora do ar
- **Prioridade 2 (Alta)**: Problemas que impedem trabalho, bugs bloqueadores
- **Prioridade 3 (Média)**: Problemas importantes mas com workarounds
- **Prioridade 4 (Baixa)**: Melhorias, dúvidas, problemas menores

## REGRAS DE RETORNO:
- **CENÁRIO 1**: Casos similares para TODOS os campos → Categorização completa
- **CENÁRIO 2**: Casos similares para ALGUNS campos → Campos encontrados preenchidos, outros como null
- **CENÁRIO 3**: NENHUM caso similar → Retorne null para o chamado completo
- **LIMIAR DE SIMILARIDADE**: Se confidence < 0.6, considere retornar null

## NOVO CHAMADO:
${JSON.stringify(ticket, null, 2)}

## HISTÓRICO DE CHAMADOS (base para categorização):
${JSON.stringify(historicalFiles.slice(0, 50), null, 2)}

## INSTRUÇÕES DETALHADAS:
1. **Identifique o problema central** no novo chamado
2. **Procure no histórico** casos com problemas genuinamente similares
3. **Avalie a qualidade da similaridade**: contexto técnico, tipo de usuário, complexidade
4. **Para cada campo** (tags, squad, origin, assignees): só preencha se encontrar casos verdadeiramente similares
5. **Confidence**: 0.8-1.0 = muito similar, 0.6-0.7 = moderadamente similar, <0.6 = considere null
6. **Reasoning**: Explique brevemente quais casos do histórico foram usados como base e por quê
7. **Priorize precisão sobre completude** - é melhor deixar campos como null do que categorizar incorretamente
`;
                       
            const response = await this.googleGenAi.models.generateContent({
                model: this.modelName,
                contents: [
                  { text: prompt},
                ],
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: "object",
                    properties: {
                      priority: { type: "number", minimum: 1, maximum: 4 },
                      tags: { type: "array", items: { type: "object", properties: { name: { type: "string" }, tag_fg: { type: "string" }, tag_bg: { type: "string" }, creator: { type: "number" } } } },
                      squad: { type: "object", properties: { field_id: { type: "string" }, value: { type: "number" }, option: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, color: { type: "string" }, orderindex: { type: "number" } } } } },
                      origin: { type: "object", properties: { field_id: { type: "string" }, value: { type: "number" }, option: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, color: { type: "string" }, orderindex: { type: "number" } } } } },
                      assignees: { type: "array", items: { type: "object", properties: { id: { type: "number" }, username: { type: "string" } } } },
                      reasoning: { type: "string" },
                      confidence: { type: "number", minimum: 0.1, maximum: 1.0 }
                    }
                  }
                }
            });

            return parseGeminiResponse(response.text);
            
        } catch (error) {
            this.logger.error('Error in categorization:', error.message);
            throw error;
        }
    }
}