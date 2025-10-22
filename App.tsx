

import React, { useState, useCallback, useRef, useReducer, useEffect } from 'react';
import { ViewState, InterviewType, ChatMessage, FinalReport, HistoricalInterviewRecord, CandidateStatus, TranscriptEntry, InterviewTemplate, User, MagicToken } from './types';
import { aiRecruiterService } from './services/geminiService';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import LiveInterviewScreen from './components/LiveInterviewScreen';
import ResultsScreen from './components/ResultsScreen';
// FIX: Changed to a named import for HrDashboard as it is not a default export.
import { HrDashboard } from './components/HrDashboard';
import useLocalStorage from './hooks/useLocalStorage';
import ErrorDisplay from './components/ErrorDisplay';
import { AgentLogoIcon, ChartBarIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, CodeBracketIcon, GaugeIcon, ComputerDesktopIcon, BeakerIcon, RobotIcon, UserCircleIcon, BuildingOfficeIcon, EnvelopeIcon, CheckCircleIcon, SendIcon } from './components/icons';
import DarkVeilBackground from './components/DarkVeilBackground';
import ScrollFloatText from './components/ScrollFloatText';
import Spinner from './components/Spinner';
import { DEFAULT_TEMPLATES } from './constants';

interface MediaStreams {
    camera: MediaStream;
    screen: MediaStream;
}


// --- Landing Page Component ---
interface LandingPageProps {
  onInitiateLogin: (role: User['role']) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onInitiateLogin }) => {

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const howItWorksSteps = [
      {
        icon: <ComputerDesktopIcon className="w-8 h-8 text-blue-400"/>,
        title: "Setup",
        description: "Enter job details, or load a template. Upload the candidate's resume and select interview type (Chat/Live).",
        align: 'right'
      },
      {
        icon: <RobotIcon className="w-8 h-8 text-blue-400"/>,
        title: "Interview",
        description: "The AI conducts a structured interview, including a coding challenge, while proctoring ensures integrity.",
        align: 'left'
      },
      {
        icon: <DocumentTextIcon className="w-8 h-8 text-blue-400"/>,
        title: "Review",
        description: "A detailed report is generated instantly, covering skills, behavior, and salary recommendations.",
        align: 'right'
      },
      {
        icon: <ChartBarIcon className="w-8 h-8 text-blue-400"/>,
        title: "Manage",
        description: "Use the HR Dashboard to compare candidates, track progress, and communicate next steps.",
        align: 'left'
      }
  ];
  
  return (
    <div className="w-full bg-transparent text-white">
      <header className="sticky top-0 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 p-4 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AgentLogoIcon className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">AI Recruitment Agent</span>
          </div>
          <div className='flex items-center gap-6'>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#prepare" onClick={(e) => handleNavClick(e, 'prepare')} className="text-slate-300 hover:text-white transition-colors">Prepare</a>
            </nav>
            <button 
              onClick={() => onInitiateLogin('HR')}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600/50 border border-blue-500 rounded-lg hover:bg-blue-600/70 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </header>
      <main>
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center text-center relative px-4">
            <div className="max-w-4xl animate-slide-in-up">
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 leading-tight">
                    The Future of Hiring is Here.
                </h1>
                <h2 className="mt-4 text-5xl md:text-7xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    Smarter, Faster AI-Powered Interviews.
                </h2>
            </div>
            <ScrollFloatText textContent="SCROLL DOWN" />
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-black/20 backdrop-blur-2xl">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl font-bold mb-2">Revolutionize Your Hiring</h2>
                <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Our AI-powered platform provides a comprehensive suite of tools to streamline your recruitment process from start to finish.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    {[
                        { icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-400"/>, title: "Interactive Interviews", desc: "Engage candidates with dynamic chat or live voice interviews that adapt in real-time." },
                        { icon: <DocumentTextIcon className="w-8 h-8 text-blue-400"/>, title: "Intelligent Analysis", desc: "Go beyond keywords with AI that analyzes resumes and job descriptions for true skill alignment." },
                        { icon: <ShieldCheckIcon className="w-8 h-8 text-blue-400"/>, title: "Advanced Proctoring", desc: "Ensure interview integrity with automated monitoring for chat plagiarism and webcam policy violations." },
                        { icon: <CodeBracketIcon className="w-8 h-8 text-blue-400"/>, title: "Live Coding Challenges", desc: "Assess practical skills with an integrated IDE and AI-assisted evaluation for Python tasks." },
                        { icon: <GaugeIcon className="w-8 h-8 text-blue-400"/>, title: "In-Depth Reporting", desc: "Receive comprehensive reports with scoring, behavioral analysis, and salary suggestions." },
                        { icon: <ChartBarIcon className="w-8 h-8 text-blue-400"/>, title: "HR Dashboard & Analytics", desc: "Manage candidates, compare profiles, and gain insights into your hiring pipeline." },
                    ].map(f => (
                        <div key={f.title} className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                            <div className="mb-4">{f.icon}</div>
                            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                            <p className="text-slate-400 text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-12">Simple Steps to a Smarter Hire</h2>
                </div>
                <div className="relative max-w-3xl mx-auto">
                    <div className="border-l-2 border-slate-700/50 absolute h-full top-0 left-1/2 -translate-x-1/2"></div>
                    <div className="space-y-16">
                        {howItWorksSteps.map((step, index) => (
                            <div key={index} className="flex justify-between items-center w-full">
                                {step.align === 'left' && (
                                    <>
                                        <div className="w-1/2 pr-8 text-right">
                                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                                                <h3 className="font-bold text-2xl text-slate-100 mb-2">{step.title}</h3>
                                                <p className="text-slate-400">{step.description}</p>
                                            </div>
                                        </div>
                                        <div className="z-10 bg-slate-800 p-4 rounded-full border-2 border-slate-600 bg-slate-900">{step.icon}</div>
                                        <div className="w-1/2"></div>
                                    </>
                                )}
                                {step.align === 'right' && (
                                    <>
                                        <div className="w-1/2"></div>
                                        <div className="z-10 bg-slate-800 p-4 rounded-full border-2 border-slate-600 bg-slate-900">{step.icon}</div>
                                        <div className="w-1/2 pl-8 text-left">
                                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                                                <h3 className="font-bold text-2xl text-slate-100 mb-2">{step.title}</h3>
                                                <p className="text-slate-400">{step.description}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>


        {/* Candidate Prep Section */}
        <section id="prepare" className="py-20 bg-black/20 backdrop-blur-2xl">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl font-bold mb-2">Preparing for Your AI Interview?</h2>
                <p className="text-slate-400 mb-12 max-w-2xl mx-auto">As a candidate, here are some tips to ensure a smooth and successful interview experience.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                        <h3 className="font-semibold text-lg mb-2">Find a Quiet Space</h3>
                        <p className="text-slate-400 text-sm">Minimize background noise and distractions. For live interviews, ensure you are in a well-lit room.</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                        <h3 className="font-semibold text-lg mb-2">Be Authentic</h3>
                        <p className="text-slate-400 text-sm">The AI is designed to assess your genuine skills and experience. Answer naturally and honestly. Our proctoring systems will flag non-genuine responses.</p>
                    </div>
                     <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                        <h3 className="font-semibold text-lg mb-2">Think Aloud</h3>
                        <p className="text-slate-400 text-sm">During coding challenges, explain your thought process. The AI evaluates your problem-solving approach, not just the final code.</p>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <footer className="py-8 border-t border-white/10 text-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} AI Recruitment Agent. All rights reserved.</p>
      </footer>
    </div>
  );
};

// --- Login Screen Component ---
interface LoginScreenProps {
  onLogin: (email: string, role: User['role']) => void;
  onBack: () => void;
  isLoading: boolean;
  initialRole: User['role'];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack, isLoading, initialRole }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<User['role']>(initialRole);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || isLoading) return;
        setShowSuccess(true);
        onLogin(email, role);
    };
    
    const RoleButton: React.FC<{
        selected: boolean;
        onClick: () => void;
        Icon: React.FC<{className?: string}>;
        label: string;
    }> = ({ selected, onClick, Icon, label }) => (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center justify-center gap-3 p-4 border rounded-lg transition-all duration-300
                ${selected ? 'bg-blue-600/50 border-blue-500 ring-2 ring-blue-500/50' : 'bg-white/5 hover:bg-white/10 border-white/10'}
            `}
        >
            <Icon className="w-6 h-6"/>
            <span className="font-semibold">{label}</span>
        </button>
    )

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white animate-fade-in bg-transparent relative">
            <div className="w-full max-w-md">
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-slide-in-up">
                    {showSuccess ? (
                        <div className="text-center py-8">
                            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                            <h2 className="text-2xl font-bold text-slate-100">Magic Link Sent!</h2>
                            <p className="text-slate-400 mt-2 mb-6">Please check your inbox for an email from us. You will be redirected shortly.</p>
                            <Spinner />
                        </div>
                    ) : (
                        <>
                             <div className="text-center mb-8">
                                <AgentLogoIcon className="w-16 h-16 text-blue-400 mx-auto mb-4"/>
                                <h2 className="text-3xl font-bold text-slate-100">Welcome</h2>
                                <p className="text-slate-400 mt-2">Enter your email to get a login link as a {role === 'HR' ? 'HR Professional' : 'Candidate'}.</p>
                            </div>

                            <div className="flex gap-4 mb-6">
                                <RoleButton selected={role === 'Candidate'} onClick={() => setRole('Candidate')} Icon={UserCircleIcon} label="I'm a Candidate" />
                                <RoleButton selected={role === 'HR'} onClick={() => setRole('HR')} Icon={BuildingOfficeIcon} label="I'm an HR Professional" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email Address"
                                            required
                                            className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-200 placeholder-slate-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !email.trim()}
                                    className="w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white shadow-lg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Spinner size="sm" /> : <><span>Send Login Link &gt;&gt;</span></>}
                                </button>
                            </form>
                            <button onClick={onBack} className="text-sm text-slate-400 hover:text-white mt-6 w-full text-center">
                                &larr; Back to role selection
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main App State ---

type AppState = {
  view: ViewState;
  interviewType: InterviewType;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  candidateEmail: string;
  resumeText: string;
  resumeFileName: string | null;
  extractedSkills: string[];
  chatHistory: ChatMessage[];
  finalReport: FinalReport | null;
  questionCount: number;
  warningCount: number;
  isTerminated: boolean;
  codeSubmission: string;
  transcript: TranscriptEntry[];
  videoRecordingUrl: string;
  isDeeplyIdle: boolean;
};

const initialState: AppState = {
  view: ViewState.LANDING,
  interviewType: InterviewType.CHAT,
  companyName: '',
  jobTitle: '',
  jobDescription: '',
  candidateEmail: '',
  resumeText: '',
  resumeFileName: null,
  extractedSkills: [],
  chatHistory: [],
  finalReport: null,
  questionCount: 0,
  warningCount: 0,
  isTerminated: false,
  codeSubmission: '',
  transcript: [],
  videoRecordingUrl: '',
  isDeeplyIdle: false,
};

type Action =
  | { type: 'SET_VIEW'; payload: ViewState }
  | { type: 'SET_INTERVIEW_TYPE'; payload: InterviewType }
  | { type: 'SETUP_INTERVIEW'; payload: Partial<AppState> }
  | { type: 'START_INTERVIEW'; payload: ChatMessage }
  | { type: 'SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'RECEIVE_AI_RESPONSE'; payload: { message: ChatMessage; nextQuestion?: any; isGameOver?: boolean } }
  | { type: 'SET_FINAL_REPORT'; payload: FinalReport }
  | { type: 'RESET'; payload?: { view: ViewState } }
  | { type: 'FLAG_MESSAGE'; payload: { index: number, reason: string } }
  | { type: 'INCREMENT_WARNING' }
  | { type: 'TERMINATE_INTERVIEW' }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'END_LIVE_INTERVIEW'; payload: { transcript: TranscriptEntry[], code: string, videoUrl: string } }
  | { type: 'SET_IDLE_STATE'; payload: boolean };


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_INTERVIEW_TYPE':
        return { ...state, interviewType: action.payload };
    case 'SETUP_INTERVIEW':
      return { ...state, ...action.payload };
    case 'START_INTERVIEW':
        return { ...state, chatHistory: [action.payload], view: ViewState.INTERVIEW };
    case 'SEND_MESSAGE':
        return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'RECEIVE_AI_RESPONSE':
        const newState = { ...state, chatHistory: [...state.chatHistory, action.payload.message] };
        if (action.payload.nextQuestion) {
            newState.questionCount += 1;
        }
        if (action.payload.isGameOver) {
            newState.view = ViewState.RESULTS;
        }
        return newState;
    case 'SET_FINAL_REPORT':
        return { ...state, finalReport: action.payload, view: ViewState.RESULTS };
    case 'RESET':
        return { 
            ...initialState, 
            view: action.payload?.view || ViewState.SETUP
        };
    case 'FLAG_MESSAGE': {
        const newHistory = [...state.chatHistory];
        if(newHistory[action.payload.index]){
             newHistory[action.payload.index].proctoringResult = { flagged: true, reason: action.payload.reason };
        }
        return { ...state, chatHistory: newHistory };
    }
    case 'INCREMENT_WARNING':
        return { ...state, warningCount: state.warningCount + 1 };
    case 'TERMINATE_INTERVIEW':
        return { ...state, isTerminated: true };
    case 'SET_CODE':
        return { ...state, codeSubmission: action.payload };
    case 'END_LIVE_INTERVIEW':
        return { ...state, ...action.payload, view: ViewState.RESULTS };
    case 'SET_IDLE_STATE':
        return { ...state, isDeeplyIdle: action.payload };
    default:
      return state;
  }
};

const App: React.FC = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [isExtractingSkills, setIsExtractingSkills] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mediaStreams, setMediaStreams] = useState<MediaStreams | null>(null);
    const [loginRole, setLoginRole] = useState<User['role']>('Candidate');

    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [magicToken, setMagicToken] = useLocalStorage<MagicToken | null>('magicToken', null);

    const [historicalRecords, setHistoricalRecords] = useLocalStorage<HistoricalInterviewRecord[]>('historicalRecords', []);
    const [templates, setTemplates] = useLocalStorage<InterviewTemplate[]>('interviewTemplates', DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `default-${i}` })));

    // Sync user state with view
    useEffect(() => {
        // This effect handles routing based on authentication state.
        if (currentUser && magicToken) {
            // User is logged in. If they are on a public page (Landing/Login), redirect them.
            if (state.view === ViewState.LANDING || state.view === ViewState.LOGIN) {
                dispatch({ type: 'SET_VIEW', payload: currentUser.role === 'HR' ? ViewState.HISTORY : ViewState.SETUP });
            }
        } else {
            // User is not logged in. If they are on a protected page, redirect them to Landing.
            const protectedViews = [ViewState.SETUP, ViewState.INTERVIEW, ViewState.LIVE, ViewState.RESULTS, ViewState.HISTORY];
            if (protectedViews.includes(state.view)) {
                 dispatch({ type: 'SET_VIEW', payload: ViewState.LANDING });
            }
        }
    }, [currentUser, magicToken, state.view]);

    const handleError = (err: any) => {
        console.error(err);
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        setIsLoading(false);
    };

    const handleInitiateLogin = (role: User['role']) => {
        setLoginRole(role);
        dispatch({ type: 'SET_VIEW', payload: ViewState.LOGIN });
    };

    const handleLogin = (email: string, role: User['role']) => {
        setIsLoading(true);
        // Simulate API call to generate and send magic link
        setTimeout(() => {
            const user: User = { name: email.split('@')[0], role };
            const token: MagicToken = { 
                token: `magic_${Math.random().toString(36).substring(2)}`,
                email,
                role,
                expiresAt: Date.now() + 3600 * 1000 // Expires in 1 hour
            };
            setCurrentUser(user);
            setMagicToken(token);
            // The useEffect will handle the view transition
            setIsLoading(false);
        }, 1500);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setMagicToken(null);
        dispatch({ type: 'SET_VIEW', payload: ViewState.LANDING });
    };


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setIsExtractingSkills(true);
            try {
                // For simplicity, we'll just read as text. In a real app, you'd handle PDF/DOCX parsing.
                const text = await file.text();
                const skills = await aiRecruiterService.extractSkillsFromResume(text);
                dispatch({ type: 'SETUP_INTERVIEW', payload: { resumeText: text, resumeFileName: file.name, extractedSkills: skills } });
            } catch (err) {
                handleError(err);
            } finally {
                setIsLoading(false);
                setIsExtractingSkills(false);
            }
        }
    };

    const requestMediaPermissions = async (): Promise<MediaStreams | null> => {
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            return { camera: cameraStream, screen: screenStream };
        } catch (err) {
            handleError(new Error("Camera and screen sharing permissions are required for a live interview. Please grant access and try again."));
            return null;
        }
    };

    const handleStart = async () => {
        setIsLoading(true);
        setError(null);
        if (state.interviewType === InterviewType.LIVE) {
            const streams = await requestMediaPermissions();
            if (streams) {
                setMediaStreams(streams);
                dispatch({ type: 'SET_VIEW', payload: ViewState.LIVE });
            }
            setIsLoading(false);
        } else {
             try {
                const firstQuestion = await aiRecruiterService.generateFirstQuestion(state.jobDescription, state.resumeText);
                dispatch({ type: 'START_INTERVIEW', payload: firstQuestion });
            } catch (err) {
                handleError(err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEndLiveInterview = async (transcript: TranscriptEntry[], code: string, videoUrl: string) => {
        setIsLoading(true);
        setError(null);
        dispatch({ type: 'END_LIVE_INTERVIEW', payload: { transcript, code, videoUrl }});
        try {
            const historyForReport = transcript.map(t => ({ role: t.speaker, content: t.text })) as ChatMessage[];
            const report = await aiRecruiterService.generateFinalReport(historyForReport, state.jobDescription, state.resumeText, code, state.extractedSkills);
            
            const newRecord: HistoricalInterviewRecord = {
                id: new Date().toISOString(),
                date: new Date().toLocaleString(),
                jobTitle: state.jobTitle,
                candidateName: currentUser?.name || state.candidateEmail.split('@')[0],
                candidateEmail: state.candidateEmail,
                resumeFileName: state.resumeFileName || 'N/A',
                resumeText: state.resumeText,
                extractedSkills: state.extractedSkills,
                jobDescriptionSnippet: state.jobDescription.substring(0, 100) + '...',
                report,
                status: CandidateStatus.PENDING,
                transcript,
                videoRecordingUrl: videoUrl,
            };
            setHistoricalRecords(prev => [...prev, newRecord]);
            
            dispatch({ type: 'SET_FINAL_REPORT', payload: report });
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
             // Stop media streams after interview ends
            mediaStreams?.camera.getTracks().forEach(track => track.stop());
            mediaStreams?.screen.getTracks().forEach(track => track.stop());
            setMediaStreams(null);
        }
    };

    const handleSendMessage = useCallback(async (message: string) => {
        setError(null);
        const userMessage: ChatMessage = { role: 'user', content: message };
        dispatch({ type: 'SEND_MESSAGE', payload: userMessage });

        // If it's a coding challenge, just store the code and wait for AI's next step
        if (state.chatHistory[state.chatHistory.length - 1]?.is_coding_challenge) {
            dispatch({ type: 'SET_CODE', payload: message });
        }

        try {
            // Text Proctoring
            const proctorResult = await aiRecruiterService.analyzeTextResponse(message);
            if (proctorResult.cheating_detected) {
                const messageIndex = state.chatHistory.length; // The index of the user's message
                dispatch({ type: 'FLAG_MESSAGE', payload: { index: messageIndex, reason: proctorResult.reason } });
                dispatch({ type: 'INCREMENT_WARNING' });
                if (state.warningCount + 1 >= 2) {
                    dispatch({ type: 'TERMINATE_INTERVIEW' });
                    return;
                }
            }
            
            // Get AI's next step
            const nextStep = await aiRecruiterService.getNextStep(
                [...state.chatHistory, userMessage], 
                state.jobDescription, 
                state.resumeText,
                state.extractedSkills
            );

            const aiResponse: ChatMessage = {
                role: 'ai',
                content: nextStep.nextQuestion.question_text,
                analysis: nextStep.analysis,
                is_coding_challenge: nextStep.nextQuestion.is_coding_challenge
            };
            dispatch({ type: 'RECEIVE_AI_RESPONSE', payload: { message: aiResponse, nextQuestion: true, isGameOver: nextStep.interview_is_over }});

            if (nextStep.interview_is_over) {
                setIsLoading(true);
                const finalReport = await aiRecruiterService.generateFinalReport(
                    [...state.chatHistory, userMessage, aiResponse], 
                    state.jobDescription, 
                    state.resumeText,
                    state.codeSubmission,
                    state.extractedSkills
                );
                
                const newRecord: HistoricalInterviewRecord = {
                    id: new Date().toISOString(),
                    date: new Date().toLocaleString(),
                    jobTitle: state.jobTitle,
                    candidateName: currentUser?.name || state.candidateEmail.split('@')[0],
                    candidateEmail: state.candidateEmail,
                    resumeFileName: state.resumeFileName || 'N/A',
                    resumeText: state.resumeText,
                    extractedSkills: state.extractedSkills,
                    jobDescriptionSnippet: state.jobDescription.substring(0, 100) + '...',
                    report: finalReport,
                    status: CandidateStatus.PENDING,
                };
                setHistoricalRecords(prev => [...prev, newRecord]);

                dispatch({ type: 'SET_FINAL_REPORT', payload: finalReport });
                setIsLoading(false);
            }
        } catch (err) {
            handleError(err);
            const aiErrorResponse: ChatMessage = { role: 'ai', content: "I seem to be having trouble connecting. Please try again in a moment." };
            dispatch({ type: 'RECEIVE_AI_RESPONSE', payload: { message: aiErrorResponse } });
        }
    }, [state.chatHistory, state.jobDescription, state.resumeText, state.codeSubmission, state.warningCount, state.extractedSkills, currentUser, state.candidateEmail, state.resumeFileName, setHistoricalRecords]);
    
    const handleRestart = () => {
        const targetView = currentUser?.role === 'HR' ? ViewState.HISTORY : ViewState.SETUP;
        dispatch({ type: 'RESET', payload: { view: targetView } });
        setError(null);
        setIsLoading(false);
        // Stop media streams if they are active
        if (mediaStreams) {
            mediaStreams.camera.getTracks().forEach(track => track.stop());
            mediaStreams.screen.getTracks().forEach(track => track.stop());
            setMediaStreams(null);
        }
    };
    
    const handleAddTemplate = (template: Omit<InterviewTemplate, 'id'>) => {
        const newTemplate = { ...template, id: new Date().toISOString() };
        setTemplates(prev => [...prev, newTemplate]);
    };

    const handleUpdateTemplate = (updatedTemplate: InterviewTemplate) => {
        setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    };

    const handleDeleteTemplate = (templateId: string) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    };

    const handleUpdateRecord = (id: string, fields: Partial<HistoricalInterviewRecord>) => {
        setHistoricalRecords(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
    };
    
    const renderView = () => {
        switch (state.view) {
            case ViewState.LANDING:
                return <LandingPage onInitiateLogin={handleInitiateLogin} />;
            case ViewState.LOGIN:
                return <LoginScreen 
                    onLogin={handleLogin}
                    onBack={() => dispatch({ type: 'SET_VIEW', payload: ViewState.LANDING })}
                    isLoading={isLoading}
                    initialRole={loginRole}
                />;
            case ViewState.SETUP:
                return (
                    <SetupScreen
                        companyName={state.companyName}
                        setCompanyName={(val) => dispatch({ type: 'SETUP_INTERVIEW', payload: { companyName: val } })}
                        jobTitle={state.jobTitle}
                        setJobTitle={(val) => dispatch({ type: 'SETUP_INTERVIEW', payload: { jobTitle: val } })}
                        jobDescription={state.jobDescription}
                        setJobDescription={(val) => dispatch({ type: 'SETUP_INTERVIEW', payload: { jobDescription: val } })}
                        candidateEmail={state.candidateEmail}
                        setCandidateEmail={(val) => dispatch({ type: 'SETUP_INTERVIEW', payload: { candidateEmail: val } })}
                        onStart={handleStart}
                        isLoading={isLoading}
                        onFileChange={handleFileChange}
                        resumeFileName={state.resumeFileName}
                        onRemoveResume={() => dispatch({ type: 'SETUP_INTERVIEW', payload: { resumeFileName: null, resumeText: '', extractedSkills: [] }})}
                        interviewType={state.interviewType}
                        setInterviewType={(type) => dispatch({ type: 'SET_INTERVIEW_TYPE', payload: type })}
                        templates={templates}
                        onLoadTemplate={(t) => dispatch({type: 'SETUP_INTERVIEW', payload: { jobTitle: t.jobTitle, jobDescription: t.jobDescription, companyName: t.companyName }})}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        isExtractingSkills={isExtractingSkills}
                        extractedSkills={state.extractedSkills}
                    />
                );
            case ViewState.INTERVIEW:
                return <InterviewScreen 
                    chatHistory={state.chatHistory} 
                    onSendMessage={handleSendMessage}
                    isAiResponding={isLoading || (state.chatHistory.length > 0 && state.chatHistory[state.chatHistory.length - 1].role === 'user')}
                    questionCount={state.questionCount}
                    onRestart={handleRestart}
                    warningCount={state.warningCount}
                    isTerminated={state.isTerminated}
                    onConfirmTermination={handleRestart}
                    currentUser={currentUser}
                    onCandidateIdle={() => dispatch({ type: 'SET_IDLE_STATE', payload: true })}
                    isDeeplyIdle={state.isDeeplyIdle}
                    onContinueInterview={() => dispatch({ type: 'SET_IDLE_STATE', payload: false })}
                />;
            case ViewState.LIVE:
                return <LiveInterviewScreen 
                    mediaStreams={mediaStreams}
                    onEndInterview={handleEndLiveInterview}
                    jobDescription={state.jobDescription}
                    resumeText={state.resumeText}
                    onRestart={handleRestart}
                    currentUser={currentUser}
                />;
            case ViewState.RESULTS:
                return <ResultsScreen report={state.finalReport} onRestart={handleRestart} isLoading={isLoading} />;
             case ViewState.HISTORY:
                return <HrDashboard 
                    records={historicalRecords}
                    templates={templates}
                    onAddTemplate={handleAddTemplate}
                    onUpdateTemplate={handleUpdateTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onLogout={handleLogout}
                    onUpdateRecord={handleUpdateRecord}
                    currentUser={currentUser}
                />;
            default:
                return <div>Invalid State</div>;
        }
    };
    
    return (
        <>
            <DarkVeilBackground />
            <div className="w-full h-full font-sans antialiased">
                {error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}
                {renderView()}
            </div>
        </>
    );
};

export default App;