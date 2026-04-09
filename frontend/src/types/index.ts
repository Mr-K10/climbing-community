export interface Question {
  id: string;
  category: string;
  text: string;
  type: string;
  sources?: { title: string; url: string }[];
  options: { id: string; text: string }[];
}

export interface QuizSession {
  session_id: string;
  total_questions: number;
  questions: Question[];
}

export interface AdaptiveQuestion {
  id: string;
  category: string;
  primary_topics?: string[];
  secondary_topics?: string[];
  text: string;
  image_url?: string;
  sources?: { title: string; url: string }[];
  options: { id: string; text: string }[];
}

export interface AdaptiveQuestionResponse {
  session_id: string;
  status: "ongoing" | "completed";
  question: AdaptiveQuestion;
}

export interface AdaptiveAnswerResponse {
  status: "ongoing" | "completed";
  is_correct: boolean;
  correct_option_id: string;
  explanation: string;
  next_question?: AdaptiveQuestion;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_option_id: string;
  explanation: string;
  knowledge_nodes_updated: string[];
}

export interface UserProfile {
  user_id: string;
  status: "ready" | "updating";
  preferences: {
    primary_discipline: string;
    current_grade: string;
    indoor_vs_outdoor?: string;
    goal?: string;
  };
  radar_chart: Record<string, number>;
  recent_timeline_events: {
    date: string;
    type: string;
    delta: string;
  }[];
}
