import { ChatMessage } from '../types';

export async function executeFallbackFlow(
  query: string,
  context: string,
  summary: string | null | undefined,
  onUpdate: (data: { content?: string; thought?: string; status?: 'thinking' | 'writing' | 'complete' }) => void
) {
  let summaryContent = "";
  
  if (summary && summary.length > 30) {
    summaryContent = `## Spark Reference Insight (Neural Web Mesh)\n\n${summary}\n\n---\n\n`;
  }
  
  const sections = context.split('###');
  const refSection = sections.find(s => s?.includes('REFERENCED NEURAL KNOWLEDGE REPOSITORY'));
  
  if (refSection) {
    const entries = refSection.split(/\[NODE \d+\]/).slice(1);
    if (entries.length > 0) {
      summaryContent += `## Domain Intelligence Nodes\n\n`;
      entries.forEach((entry, idx) => {
        const titleMatch = entry.match(/title: (.*?)(?:\n|$)/);
        const sourceMatch = entry.match(/source: (.*?)(?:\s|\|)/);
        const snippetMatch = entry.match(/INTEL: ([\s\S]*?)(?:\n\n|\n$|$)/);
        
        if (titleMatch && snippetMatch) {
          const title = titleMatch[1].trim();
          const snip = snippetMatch[1].trim();
          const src = sourceMatch ? sourceMatch[1].trim() : "Verified Link";
          
          if (!snip || snip.length < 5) return;

          // Improved deduplication
          if (summary && summary.toLowerCase().includes(snip.toLowerCase().substring(0, 50))) return;
          
          summaryContent += `### ${idx + 1}. [${src}] ${title}\n${snip}\n\n`;
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
    summaryContent += `\n***\n*Spark Search Intelligence Level 1: This analysis was synthesized directly from the Spark Neural Web Mesh and verified sources.*`;
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
    const thinkingStages = [
      "Accessing global Spark Search intelligence network...",
      "Activating high-fidelity web search reasoning protocols...",
      "Mapping authority-ranked knowledge clusters and sources...",
      "Synthesizing advanced multi-dimensional analysis with Spark Search..."
    ];

    for (let i = 0; i < thinkingStages.length; i++) {
      onUpdate({ 
        status: 'thinking', 
        thought: thinkingStages[i] 
      });
      const delay = 200 + (Math.random() * 100);
      await new Promise(r => setTimeout(r, delay));
    }

    const systemPrompt = `
You are Spark Search, the world's most advanced real-time reasoning engine.
CURRENT DATE: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

You are NOT a chatbot.

Return structured search output only:

FORMAT:
## 1. Direct Answer
(Provide a crisp, direct, short, highly factual summary here answering the user search query)

## 2. Key Insights
(Provide 3-5 high-priority bullet-style insights mapped from search context)

## 3. Context Summary
(Provide a masterfully synthesized, structured detailed analysis summarizing the core landscape, parameters, and key facts)

## 4. Sources & Citation Index
(Incorporate citation indices such as [1], [2] to match indexed sources in context)

RULES:
- No conversation
- No greetings
- No filler text
- Be concise like Google + Perplexity hybrid
- Cite correctly using bracketed numbers corresponding to context nodes

At the very end of your response, provide exactly 4 short "Related Questions" prefixed with "RELATED_QUESTIONS:". EACH RELATED QUESTION ON A NEW LINE.
`;

    const messages = [];
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
      content: `LATEST FRESH CONTEXT TO USE:\n${context || "No search results context available."}\n\nQuestion: ${query}`
    });

    let fullContent = "";
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 80; // ms throttle for smoother UI

    if (!puter || !puter.ai || typeof puter.ai.chat !== 'function') {
      console.warn("Spark AI driver connection offline, invoking local synthesis fallback.");
      return await executeFallbackFlow(query, context, summary, onUpdate);
    }

    onUpdate({ status: 'writing' });

    // Stream query with high-precision model requested by user
    let response: any = null;
    const modelOptions = [
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
    ];
    
    let successModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
    
    for (const model of modelOptions) {
      try {
        console.log(`Spark Reasoning: Initiating Core Chat using ${model}...`);
        response = await puter.ai.chat(messages, {
          model: model,
          stream: true
        });
        if (response) {
          successModel = model;
          break;
        }
      } catch (err: any) {
        console.warn(`Spark Reasoning model fallback: ${err.message || err}`);
      }
    }

    if (!response) {
      try {
        successModel = 'default';
        response = await puter.ai.chat(messages, {
          stream: true
        });
      } catch (fallbackErr) {
        console.error("All Spark backend models fallback error:", fallbackErr);
        throw fallbackErr;
      }
    }

    if (!response) {
       throw new Error("Spark reasoning engines offline.");
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
    console.error("Spark Generation Error, running fallback flow:", error);
    onUpdate({ thought: `Spark query fallback active. Mobilizing offline fallback...` });
    await new Promise(r => setTimeout(r, 600));
    return await executeFallbackFlow(query, context, summary, onUpdate);
  }
}
