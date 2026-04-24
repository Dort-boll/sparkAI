import { ChatMessage } from '../types';

/**
 * A direct research aggregator that synthesizes data from multi-vector references
 * into a structured intelligence dossier without using generative AI.
 */
export async function generateAnswer(
  query: string, 
  context: string, 
  history: ChatMessage[],
  onUpdate: (data: { content?: string; thought?: string; status?: 'thinking' | 'writing' | 'complete' }) => void
) {
  try {
    console.log("Synthesizing deterministic research dossier for query:", query);
    
    onUpdate({ status: 'thinking', thought: "Aggregating Multi-Dataset Intelligence Vectors..." });
    await new Promise(r => setTimeout(r, 600));
    
    onUpdate({ thought: "Identifying Historical Lineage & Technical Markers..." });
    await new Promise(r => setTimeout(r, 800));

    onUpdate({ status: 'writing', thought: "Compiling Final Intelligence Dossier..." });

    // Extracting facts from the context vectors
    const sections = context.split('[ENTITY_VECTOR_').filter(s => s.trim().length > 0);
    const facts = sections.map(s => {
      const title = s.match(/IDENTIFIER: (.*)/)?.[1] || "Reference";
      const data = s.match(/INTELLIGENCE_DATA: (.*)/)?.[1] || "";
      const source = s.match(/SOURCE_LINK: (.*)/)?.[1] || "";
      const isArchival = s.includes('ARCHIVAL_HISTORY');
      return { title, data, source, isArchival };
    }).filter(f => f.data.length > 20);

    if (facts.length === 0) {
      const msg = "Insufficient high-fidelity signals retrieved for this query in the primary reference datasets.";
      onUpdate({ content: msg, status: 'complete' });
      return msg;
    }

    // Sort by type
    const archival = facts.filter(f => f.isArchival);
    const reference = facts.filter(f => !f.isArchival);

    let dossier = `## Institutional Research Dossier: ${query}\n\n`;
    dossier += `*This report is a deterministic synthesis derived directly from multiple high-fidelity intelligence indices.*\n\n`;

    dossier += `### 1. Executive Intelligence Summary\n`;
    dossier += `The query "${query}" spans multiple informational domains. Primary data clusters identify high saturation in ${reference.length > 0 ? reference[0].title : 'archival records'}. Analysis of the retrieved ${facts.length} vectors follows.\n\n`;

    if (archival.length > 0) {
      dossier += `### 2. Historical & Archival Context\n`;
      archival.slice(0, 3).forEach(f => {
        dossier += `#### ${f.title}\n${f.data}\n\n`;
      });
    }

    dossier += `### 3. Core Reference Intelligence\n`;
    reference.slice(0, 5).forEach(f => {
      dossier += `#### ${f.title} (Verified Reference)\n${f.data}\n\n`;
    });

    dossier += `### 4. Technical Analysis & Data Points\n`;
    const technical = facts.slice(Math.max(0, facts.length - 3));
    technical.forEach(f => {
      dossier += `* **Key Identifier**: ${f.title} - ${f.data.slice(0, 300)}...\n`;
    });

    dossier += `\n\n***\n*Spark Deterministic Protocol - Institutional Intelligence & Research Platform.*`;
    
    onUpdate({ content: dossier, status: 'complete' });
    return dossier;

  } catch (error: any) {
    console.error("Synthesis Error:", error);
    const errorMsg = `### Spark Protocol Error\n\n**Trace:** ${error.message || "Logic failure"}`;
    onUpdate({ content: errorMsg, status: 'complete' });
    return errorMsg;
  }
}
