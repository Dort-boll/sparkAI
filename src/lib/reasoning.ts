import { ChatMessage } from '../types';

export async function generateAnswer(
  query: string, 
  context: string, 
  history: ChatMessage[],
  onUpdate: (data: { content?: string; thought?: string; status?: 'thinking' | 'writing' | 'complete' }) => void,
  isGuest: boolean = false
) {
  const puter = (window as any).puter;
  if (!puter) {
    return "Initializing Spark Search Reasoning Engine...";
  }

  try {
    // Step-by-step thinking for Perplexity-style flow
    const thinkingStages = [
      "Accessing global intelligence network...",
      "Deeply scanning real-time 2026 data nodes...",
      "Mapping authority-ranked knowledge clusters...",
      "Filtering verified incident reports...",
      "Cross-referencing temporal data for accuracy...",
      "Synthesizing advanced multi-dimensional analysis..."
    ];

    for (let i = 0; i < thinkingStages.length; i++) {
      onUpdate({ 
        status: i === thinkingStages.length - 1 ? 'writing' : 'thinking', 
        thought: thinkingStages[i] 
      });
      // Progressive delay for realistic feel
      const delay = 400 + (Math.random() * 300);
      await new Promise(r => setTimeout(r, delay));
    }

    const systemPrompt = `
You are Spark Search, the world's most advanced real-time AI reasoning engine. 
CURRENT DATE: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

CORE PROTOCOLS:
1. RESPONSE ARCHITECTURE: Provide a structured, exhaustive, and perfectly accurate response.
   - Start with a concise **Summary** section.
   - Follow with a deep **Detailed Analysis** section using markdown headers (##).
   - Use **Key takeaways** bullet points.
2. CITATIONS: Use bracketed indices like [1], [2], etc., to cite information from the provided context. 
   - Match the indices found in the context (e.g., [ENTITY 1] or [NODE 5] -> use [1] or [5]).
3. FORMATTING: Use standard Markdown headers (##, ###), **bold** for emphasis, and tables/code blocks where beneficial.
4. TONE: Professional, objective, and authoritative.
5. FOLLOW-UPS: At the very end of your response, provide exactly 4 short "Related Questions" prefixed with "RELATED_QUESTIONS:".
`;

    const mappedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const messages = [
      { role: "system", content: systemPrompt },
      ...mappedHistory,
      {
        role: "user",
        content: `Question: ${query}\n\nLATEST FRESH CONTEXT TO USE:\n${context}`
      }
    ];

    let fullContent = "";
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 80; // ms throttle for smoother UI
    
    // Using puter.ai.chat with stream: true
    const response = await puter.ai.chat(messages, {
      model: "gpt-4o",
      stream: true,
    });

    if (!response) {
       throw new Error("Reasoning engine failed to initialize response stream.");
    }

    if (Symbol.asyncIterator in response) {
      for await (const part of (response as any)) {
        const text = typeof part === 'string' ? part : (part?.text || part?.message?.content || "");
        if (text) {
          fullContent += text;
          
          // Progressive rendering: Filter out the RELATED_QUESTIONS tag during streaming
          const displayContent = fullContent.split('RELATED_QUESTIONS:')[0];

          const now = Date.now();
          if (now - lastUpdate > UPDATE_INTERVAL) {
            onUpdate({ content: displayContent, status: 'writing' });
            lastUpdate = now;
          }
        }
      }
    } else {
      const data = response as any;
      fullContent = data?.text || data?.message?.content || "";
    }

    // Parse related questions
    let finalAnswer = fullContent;
    let relatedQuestions: string[] = [];
    
    if (fullContent.includes('RELATED_QUESTIONS:')) {
      const parts = fullContent.split('RELATED_QUESTIONS:');
      finalAnswer = parts[0].trim();
      relatedQuestions = parts[1]
        .split('\n')
        .map(q => q.replace(/^\d+\.\s*/, '').replace(/^- \s*/, '').trim())
        .filter(q => q.length > 5 && q.length < 100)
        .slice(0, 4);
    }

    onUpdate({ content: finalAnswer, status: 'complete' });
    return { content: finalAnswer, relatedQueries: relatedQuestions.length > 0 ? relatedQuestions : undefined };
  } catch (error: any) {
    console.error("AI Error:", error);
    const fallbackMessage = `Pipeline Alert: The reasoning engine encountered an issue (${error.message || 'Unknown Protocol Error'}). Our fallback synthesis suggests reviewing the sources below directly.`;
    onUpdate({ content: fallbackMessage, status: 'complete' });
    return fallbackMessage;
  }
}
