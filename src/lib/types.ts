export type OcrMode = "text" | "table" | "figure";

export const OcrModeLabels: Record<OcrMode, string> = {
  text: "Text Recognition",
  table: "Table Recognition",
  figure: "Figure Recognition",
};

export const OcrModePrompts: Record<OcrMode, string> = {
  text: "Text Recognition:",
  table: "Table Recognition:",
  figure: "Figure Recognition:",
};

export interface StructuredField {
  name: string;
  display: string;
  description: string;
  type: "string" | "number" | "date" | "currency" | "boolean";
}

export interface OcrRequest {
  image: string;
  mode: OcrMode;
  host: string;
  model: string;
  useStructured?: boolean;
  structuredFields?: StructuredField[];
}

export interface OcrResponse {
  text: string;
  error?: string;
  done: boolean;
  evalCount?: number;
  evalDuration?: number;
  detail?: string;
  url?: string;
  model?: string;
  structured?: string;
  ocrEvalCount?: number;
  ocrEvalDuration?: number;
  gemmaEvalCount?: number;
  gemmaEvalDuration?: number;
}

export interface Settings {
  host: string;
  model: string;
}

export interface HistoryItem {
  id: string;
  image: string;
  filename: string;
  mode: OcrMode;
  result: string;
  timestamp: number;
  evalDuration?: number;
  evalCount?: number;
  structured?: string;
  ocrEvalCount?: number;
  ocrEvalDuration?: number;
  gemmaEvalCount?: number;
  gemmaEvalDuration?: number;
}
