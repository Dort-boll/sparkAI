export interface CustomSource {
  id: string;
  type: 'url' | 'text';
  value: string;
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  category?: 'Reference' | 'Web' | 'Reasoning' | 'Other';
  score?: number;
}

export interface MediaResult {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  summary?: string;
  thoughts?: string[];
  sources?: SearchResult[];
  media?: MediaResult[];
  relatedQueries?: string[];
  status?: 'thinking' | 'writing' | 'complete';
  timestamp: number;
}
