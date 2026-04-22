import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function askPlantExpert(question: string, plantContext?: string, knowledgeContext?: string) {
  try {
    let prompt: string;

    if (knowledgeContext) {
      prompt = `你是一位专业的植物养护专家。以下是相关的知识库内容，请参考这些信息来回答用户的问题：

${knowledgeContext}

${plantContext ? `当前正在咨询的植物是：${plantContext}。\n` : ""}用户问题：${question}
请用亲切、专业的语气回答，尽量简洁明了。`;
    } else {
      prompt = `你是一位专业的植物养护专家。
      ${plantContext ? `当前正在咨询的植物是：${plantContext}。` : ""}
      请回答用户的问题：${question}
      请用亲切、专业的语气回答，尽量简洁明了。`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    return response.text || "抱歉，我现在无法回答您的问题。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，我现在无法回答您的问题。请稍后再试。";
  }
}
