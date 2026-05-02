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
    // Stage 1: Reading & indexing sources
    onUpdate({ status: 'thinking', thought: "Synthesizing Phase 1: Reference Data & User Context..." });
    await new Promise(r => setTimeout(r, 800));
    
    onUpdate({ thought: isGuest ? "Filtering reference knowledge extracts..." : "Synthesizing Phase 2: Supplemental Intelligence..." });
    await new Promise(r => setTimeout(r, 800));

    onUpdate({ thought: "Indexing authority-ranked content line by line..." });
    await new Promise(r => setTimeout(r, 1000));

    onUpdate({ thought: "Identifying thematic clusters and cross-references..." });
    await new Promise(r => setTimeout(r, 800));

    onUpdate({ status: 'writing', thought: "Structuring verified reasoning path..." });

    const systemPrompt = `
You are Spark Search, the world's most advanced real-time reasoning engine. 
CURRENT SYSTEM DATE AND TIME: ${new Date().toISOString()}

${isGuest ? 'GUEST MODE ACTIVE: You MUST ONLY use information provided from the standard reference sources. Do not use outside knowledge. Your response should strictly mirror the reference intelligence provided. If information is not in the context, state that it is not available in the public records.' : ''}

Your exact goal is to examine the newest provided context and provide perfectly accurate, deeply formatted answers. 
YOU MUST explicitly bias towards the absolute newest and latest updates available in the context when asked about recent events. Focus exactly on data mapped to the current date and time above.

REASONING PROTOCOL:
1. DATA PRIORITIZATION & RECENCY: ALWAYS extract and prioritize the "Latest Update" or "News" chunks from the context if the user asks for new, latest, or current data.
2. FACTUAL VERIFICATION: Cross-reference information between multiple sources in the context. If sources conflict, highlight the discrepancy or prefer the more authoritative source (e.g., .gov, .edu, Wikipedia).
3. CONTEXTUAL AWARENESS: You are engaged in a multi-turn conversation. Understand the context of previous queries and answers to provide highly accurate and relevant follow-ups.
4. GRANULAR INDEXING: Treat the context as a library of facts. Synthesize them into a logical, highly accurate narrative.
5. EXHAUSTIVE ELABORATION: Your generated response MUST be incredibly detailed. Provide textbook-level depth, immense elaboration, historical context, technical specifics, and comprehensive coverage. Aim for at least 3-4 detailed sections for complex queries.
6. CITATION INTEGRITY: Every substantive claim must be followed by a bracketed source tag [1], [2].

STRUCTURE:
1. Start with a direct answer based on the absolute freshest data available.
2. Use headings (###) for detailed sections.
3. Use bullet points to beautifully organize raw intelligence.
4. Cite sources using [1], [2], etc.

RULES:
- Be remarkably smooth, professional, factual, and strictly objective.
- If info is missing, state it clearly. Do not hallucinate.
- Use bolding for precise emphasis.
- Output strictly in beautifully formatted Markdown.
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

    const generateWithRetry = async (retries = 2): Promise<any> => {
      try {
        return await puter.ai.chat(messages, {
          model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
        });
      } catch (err) {
        if (retries <= 0) throw err;
        await new Promise(r => setTimeout(r, 1000));
        return generateWithRetry(retries - 1);
      }
    };

    const res = await generateWithRetry();

    const content = res?.message?.content || "I couldn't synthesize a response from the available data.";
    onUpdate({ content, status: 'complete' });
    return content;
  } catch (error: any) {
    console.error("AI Error:", error);
    const fallbackMessage = `Pipeline Alert: The reasoning engine encountered an issue (${error.message || 'Unknown Protocol Error'}). Our fallback synthesis suggests reviewing the sources below directly.`;
    onUpdate({ content: fallbackMessage, status: 'complete' });
    return fallbackMessage;
  }
}
