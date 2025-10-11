export enum ViewState {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  SETUP = "SETUP",
  INTERVIEW = "INTERVIEW",
  RESULTS = "RESULTS",
  HISTORY = "HISTORY",
  LIVE = "LIVE",
}

export enum InterviewType {
  CHAT = "CHAT",
  LIVE = "LIVE",
}

export enum CandidateStatus {
  PENDING = "Pending Review",
  REVIEWING = "In-Review",
  SHORTLISTED = "Shortlisted",
  REJECTED = "Rejected"
}

export interface ResponseAnalysis {
  answer_score: number;
  comments: string;
}

export interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  analysis?: ResponseAnalysis;
  isGreeting?: boolean;
  is_coding_challenge?: boolean;
  proctoringResult?: {
    flagged: boolean;
    reason: string;
  };
}

export interface NextQuestion {
  question_text: string;
  question_type: string;
  difficulty: string;
  is_coding_challenge: boolean;
}

export interface NextStep {
  analysis: ResponseAnalysis;
  nextQuestion: NextQuestion;
}

export interface SalaryBreakdown {
    base_salary: string;
    bonus: string;
    benefits: string[];
}
export interface SuggestedSalary {
  salary_range: string;
  breakdown: SalaryBreakdown;
  justification: string;
}

export interface InterviewFeedback {
  star_rating: number;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
  final_recommendation: string;
  recommendation_justification: string;
  behavioral_analysis: string;
  inferred_experience_level: string;
}

export interface FinalReport {
  feedback: InterviewFeedback;
  salary: SuggestedSalary;
}

export interface HistoricalInterviewRecord {
  id: string;
  date: string;
  jobTitle: string;
  resumeFileName: string;
  jobDescriptionSnippet: string;
  report: FinalReport;
  status: CandidateStatus;
  notes?: string;
}

export interface TranscriptEntry {
    speaker: 'ai' | 'user';
    text: string;
}