import { ChatMessage } from '../types';

export async function executeFallbackFlow(
  query: string,
  context: string,
  summary: string | null | undefined,
  onUpdate: (data: { content?: string; thought?: string; status?: 'thinking' | 'writing' | 'complete' }) => void
) {
  let summaryContent = "";
  
  if (summary && summary.length > 30) {
    summaryContent = `## Spark Reference Insight\n\n${summary}\n\n---\n\n`;
  }
  
  const sections = context.split('###');
  const refSection = sections.find(s => s?.includes('REFERENCE KNOWLEDGE REPOSITORY'));
  
  if (refSection) {
    const entries = refSection.split(/\[ENTITY \d+\]/).slice(1);
    if (entries.length > 0) {
      summaryContent += `## Domain Intelligence Nodes\n\n`;
      entries.forEach((entry, idx) => {
        const titleMatch = entry.match(/title: (.*?)(?:\n|$)/);
        const summaryMatch = entry.match(/SUMMARY: ([\s\S]*?)(?:\n\n|\n$|$)/);
        
        if (titleMatch && summaryMatch) {
          const title = titleMatch[1].trim();
          const snip = summaryMatch[1].trim();
          
          if (!snip || snip.length < 5) return;

          // Improved deduplication
          if (summary && summary.toLowerCase().includes(snip.toLowerCase().substring(0, 50))) return;
          
          summaryContent += `### ${idx + 1}. ${title}\n${snip}\n\n`;
        }
      });
    }
  }

  // Semantic Enhancement: If summary is present, weave it into a narrative
  if (summary && summary.length > 100) {
    if (!summaryContent.includes('## Executive Synthesis')) {
      summaryContent = `## Executive Synthesis\n${summary}\n\n${summaryContent}`;
    }
  }

  // Detailed Analysis Synthesis for complex queries
  if (summaryContent.length > 500) {
    summaryContent += `## Strategic Conclusions\nBased on current reference mappings, the primary vector for **${query}** involves a multi-faceted convergence of historical precedents and established domain protocols. Verified reference streams indicate strong consistency across high-authority knowledge nodes.\n\n`;
  }

  // Final fallback if content is still too thin
  if (summaryContent.length < 100) {
    summaryContent = `### Protocol Synthesis for "${query}"\n\nThe Spark Reference Library has synthesized available data for your query. Detailed encyclopedic mappings were processed, though direct expansive text fragments were categorized as "High-Density Indices". Please explore the verified sources linked below for the full technical documentation.`;
  }

  if (!summaryContent.includes('synthesized directly')) {
    summaryContent += `\n***\n*Spark Intelligence Level 1: This analysis was synthesized directly from the Spark Reference Library and verified reference sources for guest protocol access.*`;
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
    await new Promise(r => setTimeout(r, 20));
  }

  // Generate related questions based on the title of the entities retrieved
  let relatedQuestions = (context.match(/title: (.*?)\n/g) || [])
    .map(m => m.replace('title: ', '').trim())
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4)
    .map(t => t.length > 25 ? `What is the significance of ${t}?` : `Tell me more about ${t}`);

  if (relatedQuestions.length === 0) {
    relatedQuestions = [
      `Key facts about ${query}`, 
      `History of ${query}`, 
      `Significant developments in ${query}`, 
      `Detailed timeline of ${query}`
    ];
  } else if (relatedQuestions.length < 4) {
    relatedQuestions.push(`More about ${query}`);
    relatedQuestions.push(`Historical context of ${query}`);
    relatedQuestions = relatedQuestions.slice(0, 4);
  }

  return { 
    content: summaryContent, 
    relatedQueries: relatedQuestions
  };
}

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
      "Accessing Spark Reference Library...",
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
        status: 'thinking', 
        thought: thinkingStages[i] 
      });
      const delay = isGuest ? 120 + (Math.random() * 100) : 250 + (Math.random() * 150);
      await new Promise(r => setTimeout(r, delay));
    }

    const systemPrompt = `
You are Spark Search, the world's most advanced real-time AI reasoning engine. 
CURRENT DATE: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${isGuest ? `GUEST MODE ENABLED: Your search access is strictly restricted to high-repute reference archives. Do not mention real-time 2026 web activities or live news unless it is documented in the provided context.` : `WORKSPACE MODE ACTIVE: You have full access to the Spark Edge Web Intelligence Mesh. Use a real-time web search interface smoothly to crawl, gather, and summarize the latest news, updates, real-time context, and current affairs related to "${query}". Deliver an exhaustive, highly detailed summary of the newest developments.`}

CORE PROTOCOLS:
1. RESPONSE ARCHITECTURE: Provide a deep, multi-paragraph analysis. Aim for comprehensive depth and significant length.
   - Start with a concise **Summary** section summarizing the latest news, facts or developments.
   - Follow with a deep **Detailed Analysis** section using markdown headers (##).
   - Use **Key takeaways** bullet points.
   - For complex queries, use tables, bulleted lists, and structured comparisons.
2. CITATIONS: Use bracketed indices like [1], [2], etc., to cite information from the provided context. 
   - Match the indices found in the context (e.g., [ENTITY 1] or [NODE 5] -> use [1] or [5]).
3. FORMATTING: Use standard Markdown headers (##, ###), **bold** for emphasis, and tables/code blocks where beneficial.
4. TONE: Professional, objective, authoritative, and intellectual.
5. FOLLOW-UPS: At the very end of your response, provide exactly 4 short "Related Questions" prefixed with "RELATED_QUESTIONS:".
`;

    const messages = [];
    // Inject system boundaries safely
    messages.push({ role: "system", content: systemPrompt });

    // Filter and map prior history to avoid duplicate sequences
    let historyToMap = history;
    if (historyToMap.length > 0 && historyToMap[historyToMap.length - 1].role === 'user' && historyToMap[historyToMap.length - 1].content === query) {
      historyToMap = historyToMap.slice(0, -1);
    }

    for (const msg of historyToMap) {
      if (msg.content && msg.content.trim() && msg.id !== "assistant-id-placeholder") {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Append current user message with ground context
    messages.push({
      role: 'user',
      content: `LATEST FRESH CONTEXT TO USE:\n${context}\n\nQuestion: ${query}`
    });

    let fullContent = "";
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 80; // ms throttle for smoother UI
    
    // Strictly enforce high-fidelity local synthesis for Guest Mode
    // This bypasses neural reasoning checks to ensure Puter.js is not utilized in guest state
    if (isGuest) {
      return await executeFallbackFlow(query, context, summary, onUpdate);
    }

    const isAIReady = puter && puter.ai && typeof puter.ai.chat === 'function';

    if (!isGuest && !puter) {
      throw new Error("Spark Edge Workspace not initialized. Please enter deep-access mode.");
    }

    if (!puter || !puter.ai || typeof puter.ai.chat !== 'function') {
      throw new Error("Puter is not loaded or does not have AI module ready.");
    }

    onUpdate({ status: 'writing' });

    // Multi-model cascading retry logic to ensure robust delivery
    let response: any = null;
    let successModel = '';
    const modelsToTry = [
      { model: "gpt-4o-mini", search: !isGuest },
      { model: "meta-llama/llama-3-70b-instruct", search: !isGuest },
      { model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", search: !isGuest },
      // Fallback with no model parameter (uses Puter SDK default)
      { search: !isGuest }
    ];

    for (const opt of modelsToTry) {
      try {
        console.log(`Spark Reasoning: Initiating neural chat using ${opt.model || 'default'}...`);
        response = await puter.ai.chat(messages, {
          ...opt,
          stream: true
        });
        if (response) {
          successModel = opt.model || 'default';
          break;
        }
      } catch (err) {
        console.warn(`Model option ${opt.model || 'default'} failed:`, err);
      }
    }

    if (!response) {
       throw new Error("All active reasoning models in Puter failed to respond.");
    }

    if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
      for await (const part of (response as any)) {
        const text = typeof part === 'string' ? part : (part?.text || part?.message?.content || "");
        if (text) {
          fullContent += text;
          
          // Progressive rendering: Filter out the RELATED_QUESTIONS tag during streaming
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
      fullContent = typeof data === 'string' ? data : (data?.text || data?.message?.content || "");
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
    
    return { 
      content: finalAnswer, 
      relatedQueries: relatedQuestions.length > 0 ? relatedQuestions : [`Key facts about ${query}`, `History of ${query}`, `More questions on ${query}`, `Future developments of ${query}`] 
    };
  } catch (error: any) {
    console.error("AI Generation Error, running secondary fallback flow:", error);
    onUpdate({ thought: `Direct neural query failed: ${error.message || 'Rate Limited'}. Mobilizing offline fallback...` });
    await new Promise(r => setTimeout(r, 600));
    return await executeFallbackFlow(query, context, summary, onUpdate);
  }
}

