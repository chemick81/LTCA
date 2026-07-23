import type { LessonBlockRow, LessonBlockType } from '@/types/database.types';

// ---------- Tier 1 ----------

// Bloc `content` : deux variantes possibles dans l'export réel.
// 1) HTML simple en pleine largeur : { html: string }
// 2) Grille de cellules texte/image : { rows: [{ cells: [...] }] }
export interface ContentCell {
  id: string;
  type: 'text' | 'image';
  content: string; // HTML si type=text, URL si type=image
  objectFit?: string;
}

export interface ContentRow {
  id: string;
  cells: ContentCell[];
}

export interface ContentBlockData {
  html?: string;
  rows?: ContentRow[];
}

export interface VideoSubtitle {
  url: string;
  label: string;
  language: string;
  isDefault?: boolean;
}

export interface VideoCuepoint {
  time: number;
  label: string;
}

export interface VideoBlockData {
  mediaUrl: string;
  duration?: number;
  autostart?: boolean;
  showControls?: boolean;
  subtitles?: VideoSubtitle[];
  cuepoints?: VideoCuepoint[];
}

// Quiz auto-suffisant (pas de table quiz_questions/quiz_answers séparée —
// le contenu réel de l'export embarque tout dans le bloc).
export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizBlank {
  id: string;
  position: number;
  accepted_answers: string[];
}

export interface QuizQuestionMultipleChoice {
  id: string;
  type: 'multiple_choice';
  question: string;
  options: QuizOption[];
  explanation?: string;
}

export interface QuizQuestionFillBlank {
  id: string;
  type: 'fill_blank';
  question: string;
  text_with_blanks: string; // contient [blank1], [blank2]...
  blanks: QuizBlank[];
  explanation?: string;
}

export interface QuizQuestionShortAnswer {
  id: string;
  type: 'short_answer';
  question: string;
  max_length?: number;
  explanation?: string;
  // ai_grading présent dans l'export mais non exploité en V1 (pas de correction IA en direct).
}

export type QuizQuestion = QuizQuestionMultipleChoice | QuizQuestionFillBlank | QuizQuestionShortAnswer;

export interface QuizBlockData {
  questions: QuizQuestion[];
}

export interface FeedbackQuestionStarRating {
  id: string;
  type: 'star_rating';
  question: string;
  maxValue?: number;
  required?: boolean;
}

export interface FeedbackQuestionFreeText {
  id: string;
  type: 'free_text';
  question: string;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}

export type FeedbackQuestion = FeedbackQuestionStarRating | FeedbackQuestionFreeText;

export interface FeedbackBlockData {
  questions: FeedbackQuestion[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  frontBgImage?: string;
  backBgColor?: string;
}

export interface FlashcardBlockData {
  cards: FlashcardItem[];
}

// ---------- Tier 2 ----------

export interface HotspotItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  content: string;
  color?: string;
}

export interface HotspotImageBlockData {
  imageUrl: string;
  hotspots: HotspotItem[];
}

export interface DragDropItem {
  id: string;
  content: string; // HTML
  correctTargets: string[]; // ids des dropTargets où cet item est valide
}

export interface DragDropTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragDropBlockData {
  backgroundImage?: string;
  dragItems: DragDropItem[];
  dropTargets: DragDropTarget[];
}

// ---------- Tier 3 — V1 = carte récapitulative en lecture seule ----------
// Ces deux blocs sont, dans l'export réel, des mini-moteurs (canvas d'éléments
// positionnés avec variables/interactions pour interactive_slideshow ; dialogue
// IA générative multi-tours avec grading pour ai_dialogue). Reproduire leur
// fidélité complète est hors scope V1 — on affiche un résumé fidèle au contenu
// pédagogique (texte, images, objectifs) sans le moteur d'interactions.
// TODO V2 : moteur de canvas complet + dialogue IA en direct.
export interface InteractiveSlideshowBlockData {
  settings?: { width?: number; height?: number };
  slides: Array<{
    backgroundImage?: string;
    backgroundColor?: string;
    elements: Array<{
      id: string;
      type: string;
      textContent?: string;
      visible?: boolean;
    }>;
  }>;
}

export interface AiDialogueCharacter {
  id: string;
  name: string;
  role?: string;
  baseImage?: string;
}

export interface AiDialogueBlockData {
  setting?: string;
  initialMessage?: string;
  learningOutcomes?: string[];
  characters: AiDialogueCharacter[];
  backgroundImage?: string;
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
