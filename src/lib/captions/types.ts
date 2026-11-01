export interface TranscriptWord {
  id: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words?: TranscriptWord[] | undefined;
}

export interface TranscriptionResult {
  language: string;
  text: string;
  segments: TranscriptSegment[];
}

export type ScriptMode = "telugu" | "roman";
