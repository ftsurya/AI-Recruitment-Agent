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
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, CodeBracketIcon, GaugeIcon, ComputerDesktopIcon, BeakerIcon, RobotIcon, UserCircleIcon, BuildingOfficeIcon, EnvelopeIcon, CheckCircleIcon, SendIcon } from './components/icons';
import DarkVeilBackground from './components/DarkVeilBackground';
import ScrollFloatText from './components/ScrollFloatText';
import Spinner from './components/Spinner';
import { DEFAULT_TEMPLATES } from './constants';

interface MediaStreams {
    camera: MediaStream;
    screen: MediaStream;
}


// --- Landing Page Component ---
const LandingMicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0v-1.5a6 6 0 00-12 0v1.5m6 7.5v3.75m-3.75 0h7.5" />
    </svg>
);

const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);


interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="w-full bg-transparent text-white">
      <header className="sticky top-0 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 p-6 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LandingMicrophoneIcon className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">AI Recruitment Agent</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="text-slate-300 hover:text-white transition-colors">How It Works</a>
            <a href="#prepare" onClick={(e) => handleNavClick(e, 'prepare')} className="text-slate-300 hover:text-white transition-colors">Prepare</a>
          </nav>
          <button
            onClick={onLoginClick}
            className="bg-blue-600/30 backdrop-blur-md border border-blue-400/50 hover:bg-blue-600/50 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </header>
      <main>
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-104px)] flex items-center justify-center relative">
            <div className="container mx-auto text-center px-4 animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
                The Future of Hiring is Here.
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">Smarter, Faster AI-Powered Interviews.</span>
              </h1>
            </div>
            <ScrollFloatText />
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-transparent">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Smarter Hiring</h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Everything you need to automate and enhance your recruitment process, from start to finish.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up">
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Interviews</h3>
                <p className="text-slate-400 text-center">Conducts both dynamic text-based chats and realistic live voice interviews to engage candidates effectively.</p>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><DocumentTextIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Adaptive Questioning</h3>
                <p className="text-slate-400 text-center">Intelligently generates questions based on the job description and candidate's resume for a tailored assessment.</p>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><GaugeIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Real-time Evaluation</h3>
                <p className="text-slate-400 text-center">Analyzes candidate responses in real-time, providing instant scoring and constructive feedback.</p>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChartBarIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">In-depth Reporting</h3>
                <p className="text-slate-400 text-center">Generates comprehensive reports with overall scores, strength/weakness analysis, and salary suggestions.</p>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ShieldCheckIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Interview Integrity</h3>
                <p className="text-slate-400 text-center">Employs advanced AI proctoring to monitor for cheating, ensuring a fair and authentic evaluation process.</p>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><CodeBracketIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Interactive Coding Challenges</h3>
                <p className="text-slate-400 text-center">Includes a fully-functional Python IDE for assessing technical skills with hands-on coding exercises.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">A simple four-step process to streamline your recruitment.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><DocumentTextIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">1. Provide Details</h3>
                <p className="text-slate-400 text-center">Upload the job description and candidate's resume to provide context for the AI.</p>
              </div>
              {/* Step 2 */}
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">2. AI Conducts Interview</h3>
                <p className="text-slate-400 text-center">Our AI engages the candidate in a comprehensive text or voice-based interview.</p>
              </div>
              {/* Step 3 */}
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChartBarIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">3. Get Instant Report</h3>
                <p className="text-slate-400 text-center">Receive a detailed analysis of skills, performance, and salary recommendations.</p>
              </div>
               {/* Step 4 */}
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ShieldCheckIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">4. Ensure Integrity</h3>
                <p className="text-slate-400 text-center">Built-in proctoring ensures response authenticity and fair evaluation for all candidates.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Preparation Guide Section */}
        <section id="prepare" className="py-20 bg-transparent">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Preparing for Your Interview</h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Follow these guidelines to ensure a smooth and successful AI-powered interview experience.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-full"><ComputerDesktopIcon className="w-8 h-8 text-blue-300"/></div>
                  <h3 className="text-xl font-semibold">Your Environment</h3>
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-2">
                  <li>Find a quiet, well-lit space where you won't be disturbed.</li>
                  <li>Ensure a stable and fast internet connection.</li>
                  <li>For live interviews, confirm your camera and microphone are working correctly.</li>
                  <li>Close all unnecessary applications and browser tabs.</li>
                </ul>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-full"><BeakerIcon className="w-8 h-8 text-blue-300"/></div>
                  <h3 className="text-xl font-semibold">Your Approach</h3>
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-2">
                  <li>Treat this as a professional interview with a human recruiter.</li>
                  <li>Be ready to discuss your skills and experience as listed on your resume.</li>
                  <li>For coding challenges, articulate your thought process clearly.</li>
                  <li>Listen carefully to the AI's questions and answer thoughtfully.</li>
                </ul>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-full"><ShieldCheckIcon className="w-8 h-8 text-blue-300"/></div>
                  <h3 className="text-xl font-semibold">Interview Integrity</h3>
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-2">
                  <li>Do not use your phone, search the web, or use AI assistance.</li>
                  <li>Our system actively monitors for cheating to ensure a fair process.</li>
                  <li>All responses, whether text or voice, must be in English.</li>
                  <li>Authenticity is key. Your own knowledge is all you need.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="p-6 text-center text-slate-500 bg-transparent">
        <p>&copy; {new Date().getFullYear()} AI Recruitment Agent. All rights reserved.</p>
      </footer>
    </div>
  );
};


// --- Login Page Component ---
type UserRole = 'Candidate' | 'HR';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail('');
    setIsLinkSent(false);
    setIsLoading(false);
    setLoginMessage('');
  };

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !selectedRole) return;
    
    setIsLoading(true);
    setLoginMessage('');

    // Simulate sending an email and generating a token
    setTimeout(() => {
        const token = crypto.randomUUID();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry

        const magicToken: MagicToken = {
            token,
            email,
            role: selectedRole,
            expiresAt
        };

        // In a real app, an email would be sent. Here we use localStorage to simulate the backend.
        localStorage.setItem('magic-token', JSON.stringify(magicToken));

        setIsLoading(false);
        setIsLinkSent(true);
        setLoginMessage(`For this demo, a magic link has been generated for ${email}. Click below to log in.`);
    }, 1500);
  };
  
  const handleLoginWithToken = () => {
    setIsLoading(true);
    setLoginMessage('');

    // Simulate delay for validating the token
    setTimeout(() => {
        const tokenData = localStorage.getItem('magic-token');
        if (!tokenData) {
            setLoginMessage('Login failed. No valid login link found. Please request a new one.');
            setIsLoading(false);
            setIsLinkSent(false);
            return;
        }

        try {
            const magicToken: MagicToken = JSON.parse(tokenData);
            if (Date.now() > magicToken.expiresAt) {
                setLoginMessage('Your login link has expired. Please request a new one.');
                localStorage.removeItem('magic-token');
                setIsLoading(false);
                setIsLinkSent(false);
                return;
            }
            
            // Success
            const name = magicToken.role === 'HR' ? 'HR Professional' : (magicToken.email.split('@')[0] || 'Candidate');
            onLogin({ name, role: magicToken.role });
            localStorage.removeItem('magic-token');

        } catch (error) {
            setLoginMessage('An error occurred during login. Please try again.');
            localStorage.removeItem('magic-token');
            setIsLoading(false);
            setIsLinkSent(false);
        }
    }, 1000);
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setEmail('');
    setIsLinkSent(false);
    setLoginMessage('');
  };

  const isFormVisible = selectedRole !== null;
  const isSendButtonDisabled = !email.trim() || isLoading;

  return (
    <div className="min-h-screen w-full bg-transparent text-white flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center w-full max-w-lg mx-auto">
        <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-6 ring-1 ring-blue-500/20">
          <RobotIcon className="w-12 h-12 text-blue-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome</h1>
        <p className="text-md text-slate-400 mb-8 h-5">
          {loginMessage || (isFormVisible 
            ? `Enter your email to get a login link as a ${selectedRole}.`
            : 'Please select your role to continue.'
          )}
        </p>

        {/* Role Selection */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8 transition-opacity duration-500 ${isFormVisible ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <button
            onClick={() => handleRoleSelect('Candidate')}
            disabled={isFormVisible}
            className={`group bg-white/5 backdrop-blur-lg hover:bg-white/10 border rounded-2xl p-6 text-left transition-all duration-300 flex items-center gap-4
              ${selectedRole === 'Candidate' ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-white/10'}`}
          >
            <UserCircleIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <div><h2 className="text-lg font-semibold text-slate-100">I'm a Candidate</h2></div>
          </button>
          <button
            onClick={() => handleRoleSelect('HR')}
            disabled={isFormVisible}
            className={`group bg-white/5 backdrop-blur-lg hover:bg-white/10 border rounded-2xl p-6 text-left transition-all duration-300 flex items-center gap-4
              ${selectedRole === 'HR' ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-white/10'}`}
          >
            <BuildingOfficeIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <div><h2 className="text-lg font-semibold text-slate-100">I'm an HR Professional</h2></div>
          </button>
        </div>

        {/* Login Form / Success Message */}
        <div className="h-48 flex items-center justify-center">
        {isFormVisible && (
            isLinkSent ? (
                <div className="text-center animate-fade-in w-full">
                    <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                    <h2 className="text-2xl font-semibold text-slate-200 mb-6">Link Generated!</h2>
                    <button
                        onClick={handleLoginWithToken}
                        disabled={isLoading}
                        className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 border flex items-center justify-center ${
                           isLoading 
                           ? 'bg-slate-700/50 border-slate-600 text-slate-500 cursor-not-allowed'
                           : 'bg-green-600/40 backdrop-blur-md border-green-400/60 hover:bg-green-500/60 text-white shadow-lg shadow-green-500/30'
                        }`}
                    >
                         {isLoading ? <Spinner size="sm" /> : 'Log In (from simulated email)'}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSendLink} className="w-full animate-slide-in-up">
                    <div className="relative mb-6">
                        <EnvelopeIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-4 -translate-y-1.2/2" />
                        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-200 placeholder-slate-500" required />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendButtonDisabled}
                      className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 border flex items-center justify-center gap-2 ${
                        !isSendButtonDisabled
                          ? 'bg-blue-600/40 backdrop-blur-md border-blue-400/60 hover:bg-blue-500/60 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-700/50 border-slate-600 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? <Spinner size="sm" /> : <>Send Login Link <SendIcon className="w-4 h-4" /></>}
                    </button>
                </form>
            )
        )}
        </div>
        
        {isFormVisible && (
             <button
                onClick={handleBackToRoleSelection}
                className="mt-4 text-sm text-slate-400 hover:text-white transition-colors"
            >
                &larr; Back to role selection
            </button>
        )}
      </div>
    </div>
  );
};


// --- App State Management using useReducer ---

interface AppState {
  viewState: ViewState;
  currentUser: User | null;
}

type AppAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_VIEW_STATE'; payload: ViewState };

const initialState: AppState = {
  viewState: ViewState.LANDING,
  currentUser: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.payload,
        viewState: action.payload.role === 'HR' ? ViewState.HISTORY : ViewState.SETUP,
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        viewState: ViewState.LANDING,
      };
    case 'SET_VIEW_STATE':
      return {
        ...state,
        viewState: action.payload,
      };
    default:
      return state;
  }
}


// --- Main App Component ---
const App: React.FC = () => {
    const [appState, dispatch] = useReducer(appReducer, initialState);
    const { viewState, currentUser } = appState;

    const [companyName, setCompanyName] = useState<string>('');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [candidateEmail, setCandidateEmail] = useState<string>('');
    const [resumeText, setResumeText] = useState<string>('');
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);
    const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.CHAT);
    const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExtractingSkills, setIsExtractingSkills] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

    const [chatWarningCount, setChatWarningCount] = useState(0);
    const [isChatTerminated, setIsChatTerminated] = useState(false);
    const [isCandidateDeeplyIdle, setIsCandidateDeeplyIdle] = useState(false);

    const [mediaStreams, setMediaStreams] = useState<MediaStreams | null>(null);
    const mediaStreamsRef = useRef<MediaStreams | null>(null);

    const [history, setHistory] = useLocalStorage<HistoricalInterviewRecord[]>('interviewHistory', []);
    const [templates, setTemplates] = useLocalStorage<InterviewTemplate[]>('interviewTemplates', []);
    const [templatesInitialized, setTemplatesInitialized] = useLocalStorage('templatesInitialized', false);

    useEffect(() => {
        if (!templatesInitialized) {
            const initialTemplatesWithIds: InterviewTemplate[] = DEFAULT_TEMPLATES.map((t, index) => ({
                ...t,
                id: `default-${Date.now()}-${index}`
            }));
            setTemplates(initialTemplatesWithIds);
            setTemplatesInitialized(true);
        }
    }, [templatesInitialized, setTemplates, setTemplatesInitialized]);
    
    const stopMediaStreams = useCallback(() => {
        if (mediaStreamsRef.current) {
            mediaStreamsRef.current.camera.getTracks().forEach(track => track.stop());
            mediaStreamsRef.current.screen.getTracks().forEach(track => track.stop());
            mediaStreamsRef.current = null;
            setMediaStreams(null);
        }
    }, []);

    const clearInterviewState = useCallback(() => {
        stopMediaStreams();
        setCompanyName('');
        setJobTitle('');
        setJobDescription('');
        setCandidateEmail('');
        setResumeText('');
        setResumeFileName(null);
        setExtractedSkills([]);
        setChatHistory([]);
        setFinalReport(null);
        setError(null);
        setIsLoading(false);
        setIsAiResponding(false);
        setChatWarningCount(0);
        setIsChatTerminated(false);
        setIsCandidateDeeplyIdle(false);
    }, [stopMediaStreams]);

    const handleRestart = useCallback(() => {
        clearInterviewState();
        dispatch({ type: 'SET_VIEW_STATE', payload: ViewState.SETUP });
    }, [clearInterviewState]);

    const handleLogout = useCallback(() => {
        clearInterviewState();
        dispatch({ type: 'LOGOUT' });
    }, [clearInterviewState]);
    
    const handleUpdateRecord = (recordId: string, updatedFields: Partial<HistoricalInterviewRecord>) => {
        setHistory(prevHistory => 
            prevHistory.map(record => 
                record.id === recordId ? { ...record, ...updatedFields } : record
            )
        );
    };

    const handleCandidateIdle = () => {
        if (isAiResponding || isCandidateDeeplyIdle) return;
    
        const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
    
        if (lastMessage && lastMessage.role === 'ai') {
            if (lastMessage.isNudge) {
                // Already nudged, now show the modal.
                setIsCandidateDeeplyIdle(true);
            } else {
                // First idle period, send a nudge.
                const nudgeMessage: ChatMessage = {
                    role: 'ai',
                    content: "Just checking in, are you still there? Please take your time to respond.",
                    isNudge: true
                };
                setChatHistory(prev => [...prev, nudgeMessage]);
            }
        }
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setResumeFileName(file.name);
            setExtractedSkills([]);
            setIsExtractingSkills(true);
            setError(null);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                setResumeText(text || "File content could not be read.");
                if (text) {
                    try {
                        const skills = await aiRecruiterService.extractSkillsFromResume(text);
                        setExtractedSkills(skills);
                    } catch (err: any) {
                        setError(`Failed to extract skills from resume: ${err.message}. Please try another file.`);
                        setResumeFileName(null);
                        setResumeText('');
                        setExtractedSkills([]);
                    } finally {
                        setIsExtractingSkills(false);
                    }
                } else {
                    setIsExtractingSkills(false);
                }
            };
            reader.readAsText(file);
        }
    };
    
    const handleStartInterview = async () => {
        if (!jobTitle.trim() || !jobDescription.trim() || !resumeText) {
            setError("Job title, job description and resume are required.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const jobContext = `Job Title: ${jobTitle}\n\n${jobDescription}`;

        if (interviewType === InterviewType.CHAT) {
            try {
                const firstMessage = await aiRecruiterService.generateFirstQuestion(jobContext, resumeText);
                setChatHistory([firstMessage]);
                dispatch({ type: 'SET_VIEW_STATE', payload: ViewState.INTERVIEW });
            } catch (e: any) {
                setError(e.message);
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        } else if (interviewType === InterviewType.LIVE) {
             try {
                const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: { suppressLocalAudioPlayback: true } as any });
                
                const streams = { camera: cameraStream, screen: screenStream };
                mediaStreamsRef.current = streams;
                setMediaStreams(streams);
                dispatch({ type: 'SET_VIEW_STATE', payload: ViewState.LIVE });
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleSendMessage = async (message: string) => {
        if (isChatTerminated) return;
        
        setIsAiResponding(true);
        setError(null);
        
        const isCodingSubmission = chatHistory[chatHistory.length - 1]?.is_coding_challenge;
        const codeSubmission = isCodingSubmission ? message : undefined;
        
        const newUserMessage: ChatMessage = { role: 'user', content: message };
        const currentChatHistory = [...chatHistory, newUserMessage];
        setChatHistory(currentChatHistory);

        // Analyze user response for cheating
        try {
            const proctoringResult = await aiRecruiterService.analyzeTextResponse(message);
            if (proctoringResult.cheating_detected) {
                const newWarningCount = chatWarningCount + 1;
                setChatWarningCount(newWarningCount);
                if (newWarningCount >= 2) {
                     setIsChatTerminated(true);
                     setIsAiResponding(false);
                     return;
                }
                
                setChatHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === 'user') {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMessage, proctoringResult: { flagged: true, reason: proctoringResult.reason } }
                        ];
                    }
                    return prev;
                });
            }
        } catch (e: any) {
            console.error("Proctoring analysis failed:", e.message);
        }

        const jobContext = `Job Title: ${jobTitle}\n\n${jobDescription}`;

        try {
            const nextStep = await aiRecruiterService.getNextStep(currentChatHistory, jobContext, resumeText, extractedSkills);

            // Update last user message with analysis
            setChatHistory(prev => {
                const lastMessage = prev[prev.length - 1];
                if(lastMessage.role === 'user') {
                   return [...prev.slice(0, -1), { ...lastMessage, analysis: nextStep.analysis }];
                }
                return prev;
            });

            const aiResponse: ChatMessage = {
                role: 'ai',
                content: nextStep.nextQuestion.question_text,
                is_coding_challenge: nextStep.nextQuestion.is_coding_challenge
            };
            setChatHistory(prev => [...prev, aiResponse]);

            if (nextStep.interview_is_over) {
                setIsLoading(true);
                dispatch({ type: 'SET_VIEW_STATE', payload: ViewState.RESULTS });
                const finalHistory = [...currentChatHistory, aiResponse];
                const report = await aiRecruiterService.generateFinalReport(finalHistory, jobContext, resumeText, codeSubmission, extractedSkills);
                setFinalReport(report);

                 // Save to history
                const newRecord: HistoricalInterviewRecord = {
                    id: new Date().toISOString(),
                    date: new Date().toLocaleDateString(),
                    jobTitle: jobTitle,
                    candidateName: currentUser?.name || 'Candidate',
                    candidateEmail: candidateEmail,
                    resumeFileName: resumeFileName || 'N/A',
                    jobDescriptionSnippet: jobDescription.substring(0, 100) + '...',
                    report: report,
                    status: CandidateStatus.PENDING,
                    notes: '',
                    resumeText: resumeText,
                    extractedSkills: extractedSkills,
                };
                setHistory(prev => [newRecord, ...prev]);

                setIsLoading(false);
            }
        } catch (e: any) {
            setError(e.message);
            console.error(e);
        } finally {
            setIsAiResponding(false);
        }
    };

    const handleEndLiveInterview = async (transcript: TranscriptEntry[], code: string, videoUrl: string) => {
        stopMediaStreams();
        dispatch({ type: 'SET_VIEW_STATE', payload: ViewState.RESULTS });
        setIsLoading(true);
        setError(null);
        
        const jobContext = `Job Title: ${jobTitle}\n\n${jobDescription}`;

        // Convert transcript to chat history format for report generation
        const chatHistoryForReport: ChatMessage[] = transcript.map(t => ({
            role: t.speaker,
            content: t.text
        }));

        try {
            const report = await aiRecruiterService.generateFinalReport(chatHistoryForReport, jobContext, resumeText, code, extractedSkills);
            setFinalReport(report);

            // Save to history
            const newRecord: HistoricalInterviewRecord = {
                id: new Date().toISOString(),
                date: new Date().toLocaleDateString(),
                jobTitle: jobTitle,
                candidateName: currentUser?.name || 'Candidate',
                candidateEmail: candidateEmail,
                resumeFileName: resumeFileName || 'N/A',
                jobDescriptionSnippet: jobDescription.substring(0, 100) + '...',
                report: report,
                status: CandidateStatus.PENDING,
                notes: '',
                resumeText: resumeText,
                extractedSkills: extractedSkills,
                videoRecordingUrl: videoUrl,
                transcript: transcript,
            };
            setHistory(prev => [newRecord, ...prev]);

        } catch (e: any) {
            setError(e.message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadTemplate = (template: InterviewTemplate) => {
        setCompanyName(template.companyName);
        setJobTitle(template.jobTitle);
        setJobDescription(template.jobDescription);
    };

    const renderContent = () => {
        switch (viewState) {
            case ViewState.LANDING:
                return <LandingPage onLoginClick={() => dispatch({ type: 'SET_VIEW_STATE', payload: ViewState.LOGIN })} />;
            case ViewState.LOGIN:
                return <LoginPage onLogin={(user) => dispatch({ type: 'LOGIN', payload: user })} />;
            case ViewState.SETUP:
                return (
                    <SetupScreen
                        companyName={companyName} setCompanyName={setCompanyName}
                        jobTitle={jobTitle} setJobTitle={setJobTitle}
                        jobDescription={jobDescription} setJobDescription={setJobDescription}
                        candidateEmail={candidateEmail} setCandidateEmail={setCandidateEmail}
                        onStart={handleStartInterview}
                        isLoading={isLoading}
                        onFileChange={handleFileChange}
                        resumeFileName={resumeFileName}
                        onRemoveResume={() => { setResumeFileName(null); setResumeText(''); setExtractedSkills([]); }}
                        interviewType={interviewType}
                        setInterviewType={setInterviewType}
                        templates={templates}
                        onLoadTemplate={handleLoadTemplate}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        isExtractingSkills={isExtractingSkills}
                        extractedSkills={extractedSkills}
                    />
                );
            case ViewState.INTERVIEW:
                return (
                    <InterviewScreen
                        chatHistory={chatHistory}
                        onSendMessage={handleSendMessage}
                        isAiResponding={isAiResponding}
                        questionCount={chatHistory.filter(m => m.role === 'ai' && !m.isGreeting && !m.isNudge).length}
                        onRestart={handleRestart}
                        warningCount={chatWarningCount}
                        isTerminated={isChatTerminated}
                        onConfirmTermination={handleRestart}
                        currentUser={currentUser}
                        onCandidateIdle={handleCandidateIdle}
                        isDeeplyIdle={isCandidateDeeplyIdle}
                        onContinueInterview={() => setIsCandidateDeeplyIdle(false)}
                    />
                );
            case ViewState.LIVE:
                return (
                    <LiveInterviewScreen 
                        mediaStreams={mediaStreams}
                        onEndInterview={handleEndLiveInterview}
                        jobDescription={jobDescription}
                        resumeText={resumeText}
                        onRestart={handleRestart}
                        currentUser={currentUser}
                    />
                );
            case ViewState.RESULTS:
                return <ResultsScreen report={finalReport} onRestart={handleRestart} isLoading={isLoading} />;
            case ViewState.HISTORY:
                return (
                    <HrDashboard
                        records={history}
                        templates={templates}
                        onAddTemplate={(t) => setTemplates(prev => [...prev, {...t, id: `user-${Date.now()}`}])}
                        onUpdateTemplate={(t) => setTemplates(prev => prev.map(pt => pt.id === t.id ? t : pt))}
                        onDeleteTemplate={(id) => setTemplates(prev => prev.filter(t => t.id !== id))}
                        onLogout={handleLogout}
                        onUpdateRecord={handleUpdateRecord}
                        currentUser={currentUser}
                    />
                );
            default:
                return <div>Invalid state</div>;
        }
    };

    return (
        <>
            <DarkVeilBackground />
            <div className="font-sans">
                {error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}
                {renderContent()}
            </div>
        </>
    );
};

// FIX: Added a default export for the App component.
export default App;