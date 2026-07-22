import type { LessonBlockRow, LessonBlockType } from '@/types/database.types';

// ---------- Tier 1 ----------

export interface ContentCell {
  html: string;
  imageUrl?: string;
}

export interface ContentBlockData {
  rows: { cells: ContentCell[] }[];
}

export interface VideoCuepoint {
  timeSeconds: number;
  label: string;
}

export interface VideoBlockData {
  mediaUrl: string;
  subtitlesUrl?: string;
  cuepoints?: VideoCuepoint[];
}

export interface QuizBlockData {
  quizId: string; // référence vers table `quizzes`
  passThresholdPercent?: number;
}

export interface FeedbackBlockData {
  starRating?: boolean;
  freeText?: boolean;
  prompt?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardBlockData {
  cards: FlashcardItem[];
}

// ---------- Tier 2 ----------

export interface HotspotItem {
  id: string;
  xPercent: number;
  yPercent: number;
  title: string;
  content: string;
}

export interface HotspotImageBlockData {
  imageUrl: string;
  hotspots: HotspotItem[];
}

export interface DragItem {
  id: string;
  label: string;
}

export interface DropTarget {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  acceptsItemId: string;
}

export interface DragDropBlockData {
  backgroundImageUrl?: string;
  dragItems: DragItem[];
  dropTargets: DropTarget[];
}

// ---------- Tier 3 (affichage lecture seule V1) ----------

export interface SlideshowElement {
  id: string;
  xPercent: number;
  yPercent: number;
  widthPercent?: number;
  type: 'text' | 'image';
  content: string;
}

export interface InteractiveSlideshowBlockData {
  slides: { elements: SlideshowElement[] }[];
  // TODO V2: moteur de navigation/interactions/scoring entre slides
}

export interface AiDialogueTurn {
  speaker: string;
  text: string;
}

export interface AiDialogueBlockData {
  turns: AiDialogueTurn[];
  // TODO V2: branchement conditionnel, appels LLM en direct
}

// ---------- Union discriminée ----------

export type LessonBlockContent =
  | { type: 'content'; data: ContentBlockData }
  | { type: 'video'; data: VideoBlockData }
  | { type: 'quiz'; data: QuizBlockData }
  | { type: 'feedback'; data: FeedbackBlockData }
  | { type: 'flashcard'; data: FlashcardBlockData }
  | { type: 'hotspot_image'; data: HotspotImageBlockData }
  | { type: 'drag_drop'; data: DragDropBlockData }
  | { type: 'interactive_slideshow'; data: InteractiveSlideshowBlockData }
  | { type: 'ai_dialogue'; data: AiDialogueBlockData };

export interface TypedLessonBlock extends Omit<LessonBlockRow, 'content' | 'type'> {
  type: LessonBlockType;
  content: LessonBlockContent['data'];
}

export function isTier1(type: LessonBlockType): boolean {
  return ['content', 'video', 'quiz', 'feedback', 'flashcard'].includes(type);
}

export function isTier2(type: LessonBlockType): boolean {
  return ['hotspot_image', 'drag_drop'].includes(type);
}

export function isTier3(type: LessonBlockType): boolean {
  return ['interactive_slideshow', 'ai_dialogue'].includes(type);
}
