import { ChatMessage } from '../types';

export async function generateAnswer(
  query: string, 
  context: string, 
  history: ChatMessage[],
  onUpdate: (data: { content?: string; thought?: string; status?: 'thinking' | 'writing' | 'complete' }) => void,
  isGuest: boolean = false,
  summary?: string | null
) {
  const puter = (window as any).puter;
  
  try {
    // Step-by-step thinking for Perplexity-style flow
    const thinkingStages = isGuest ? [
      "Accessing Spark Reference Library (Wikipedia)...",
      "Scanning authority-ranked encyclopedic nodes...",
      "Mapping historical and verified knowledge clusters...",
      "Synthesizing reference analysis..."
    ] : [
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
      const delay = isGuest ? 200 + (Math.random() * 200) : 400 + (Math.random() * 300);
      await new Promise(r => setTimeout(r, delay));
    }

    if (!isGuest && !puter) {
      throw new Error("Spark Edge Workspace not initialized. Please enter deep-access mode.");
    }

    const systemPrompt = `
You are Spark Search, the world's most advanced real-time AI reasoning engine. 
CURRENT DATE: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${isGuest ? `GUEST MODE ENABLED: Your search access is strictly restricted to the Spark Reference Library (Wikipedia). Do not mention real-time 2026 web activities or live news unless it is documented in the provided context.` : `WORKSPACE MODE ACTIVE: You have full access to the Spark Edge Mesh for real-time 2026 intelligence, live news, and multi-dimensional web data. BE EXHAUSTIVE AND HIGHLY DETAILED.`}

CORE PROTOCOLS:
1. RESPONSE ARCHITECTURE: Provide a deep, multi-paragraph analysis. Aim for comprehensive depth and significant length.
   - Start with a concise **Summary** section.
   - Follow with a deep **Detailed Analysis** section using markdown headers (##).
   - Use **Key takeaways** bullet points.
   - For complex queries, use tables, bulleted lists, and structured comparisons.
2. CITATIONS: Use bracketed indices like [1], [2], etc., to cite information from the provided context. 
   - Match the indices found in the context (e.g., [ENTITY 1] or [NODE 5] -> use [1] or [5]).
3. FORMATTING: Use standard Markdown headers (##, ###), **bold** for emphasis, and tables/code blocks where beneficial.
4. TONE: Professional, objective, authoritative, and intellectual.
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
    
    if (isGuest) {
      // NON-AI GUEST MODE: Construct a detailed reference summary from the summary and context
      let summaryContent = "";
      
      if (summary && summary.length > 50) {
        summaryContent = `## Spark Reference Summary\n\n${summary}\n\n---\n\n`;
      } else {
        summaryContent = `## Reference Knowledge Summary\n\n`;
      }
      
      const sections = context.split('###');
      const refSection = sections.find(s => s.includes('REFERENCE KNOWLEDGE REPOSITORY'));
      
      if (refSection) {
        // Split by [ENTITY followed by any number of spaces, number, then ]
        const entries = refSection.split(/\[ENTITY \d+\]/).slice(1);
        if (entries.length > 0) {
          summaryContent += `## Detailed Reference Nodes\n\n`;
          entries.forEach((entry, idx) => {
            const titleMatch = entry.match(/title: (.*?)(?:\n|$)/);
            const summaryMatch = entry.match(/SUMMARY: ([\s\S]*?)(?:\n\n|\n$|$)/);
            
            if (titleMatch && summaryMatch) {
              const title = titleMatch[1].trim();
              const snip = summaryMatch[1].trim();
              
              if (!snip || snip.length < 5) return;

              // Basic deduplication against main summary
              if (summary && summary.toLowerCase().includes(snip.toLowerCase().substring(0, 40))) return;
              
              summaryContent += `### ${idx + 1}. ${title}\n${snip}\n\n`;
            }
          });
        }
      }

      // Final fallback if content is too thin
      if (summaryContent.length < 100) {
        summaryContent = `The Spark Reference Library has processed your query for **${query}**. While no expansive encyclopedic articles were found, we have retrieved several reference fragments from curated sources below.`;
      }

      if (!summaryContent.includes('synthesized directly')) {
        summaryContent += `\n***\n*This intelligence was synthesized directly from the Spark Reference Library (Wikipedia) for guest protocol access.*`;
      }

      // Step-by-step streaming visualization
      const wordChunks = summaryContent.split(' ');
      let currentDisplay = "";
      const CHUNK_SIZE = 4;
      
      for (let i = 0; i < wordChunks.length; i += CHUNK_SIZE) {
        const chunk = wordChunks.slice(i, i + CHUNK_SIZE).join(' ');
        currentDisplay += (currentDisplay ? ' ' : '') + chunk;
        
        const isLast = (i + CHUNK_SIZE) >= wordChunks.length;
        onUpdate({ 
          content: isLast ? summaryContent : currentDisplay, 
          status: isLast ? 'complete' : 'writing' 
        });
        
        // Fast but readable stream
        await new Promise(r => setTimeout(r, 25));
      }

      // Generate related questions based on the title of the entities retrieved
      const relatedQuestions = (context.match(/title: (.*?)\n/g) || [])
        .map(m => m.replace('title: ', '').trim())
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 4)
        .map(t => `Tell me more about ${t}`);

      return { 
        content: summaryContent, 
        relatedQueries: relatedQuestions.length > 0 ? relatedQuestions : [`Key facts about ${query}`, `History of ${query}`]
      };
    }

    if (!puter) {
      throw new Error("Spark Edge Workspace not initialized. Please enter deep-access mode.");
    }

    // Workspace mode: Using puter.ai.chat
    if (!puter.ai || typeof puter.ai.chat !== 'function') {
      throw new Error("Spark Intelligence (AI) module is not initialized. Please refresh to establish link.");
    }

    const response = await puter.ai.chat(messages, {
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      stream: true,
      search: true, 
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
            // We only hide it if the model has actually started writing the tag
            const displayContent = fullContent.includes('RELATED_QUESTIONS:') 
              ? fullContent.split('RELATED_QUESTIONS:')[0] 
              : fullContent;

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

      // Final Render after loop to ensure nothing is missed
      const finalDisplay = fullContent.includes('RELATED_QUESTIONS:') 
        ? fullContent.split('RELATED_QUESTIONS:')[0] 
        : fullContent;
      
      onUpdate({ content: finalDisplay, status: 'complete' });

      // Parse related questions
      let finalAnswer = finalDisplay.trim();
      let relatedQuestions: string[] = [];
      
      if (fullContent.includes('RELATED_QUESTIONS:')) {
        const parts = fullContent.split('RELATED_QUESTIONS:');
        relatedQuestions = parts[1]
          .split('\n')
          .map(q => q.replace(/^\d+\.\s*/, '').replace(/^- \s*/, '').trim())
          .filter(q => q.length > 5 && q.length < 100)
          .slice(0, 4);
      }
      
      return { content: finalAnswer, relatedQueries: relatedQuestions.length > 0 ? relatedQuestions : undefined };
    } catch (error: any) {
      console.error("AI Error:", error);
    const fallbackMessage = `Pipeline Alert: The reasoning engine encountered an issue (${error.message || 'Unknown Protocol Error'}). Our fallback synthesis suggests reviewing the sources below directly.`;
    onUpdate({ content: fallbackMessage, status: 'complete' });
    return fallbackMessage;
  }
}
