export interface EssayResult {
  id: string;
  originalEssay: string;
  improvedEssay: string;
  mode: string;
  tone: string;
  wordSuggestions: WordSuggestion[];
  changes: EssayChange[];
  summary: string;
  createdAt: Date;
}

export interface WordSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface EssayChange {
  type: "grammar" | "clarity" | "vocabulary" | "structure";
  original: string;
  improved: string;
  explanation?: string;
}

const STORAGE_KEY = "essay-improver-history";

export function saveEssay(essay: EssayResult): void {
  const history = getHistory();
  history.unshift(essay);
  if (history.length > 20) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getHistory(): EssayResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((e: any) => ({ ...e, createdAt: new Date(e.createdAt) }));
  } catch {
    return [];
  }
}

export function deleteEssay(id: string): void {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
