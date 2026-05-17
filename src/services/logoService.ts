import { GoogleGenAI } from "@google/genai";

export async function generateLogo() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A high-resolution, 1024x1024px professional logo for a financial app named 'ClariFi'. The logo should be minimalist and modern, featuring a stylized diamond or wallet shape that incorporates a subtle 'C' and an upward-trending line to represent growth and clarity. The typography for 'ClariFi' should be in a bold, geometric grotesque font similar to 'GetVoIP Grotesque'. The color scheme should be emerald green (#10b981) and deep zinc (#09090b) on a clean, solid white background. The design should be centered and have a premium, high-tech feel.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
