
import React, { useState, useCallback, useRef } from 'react';
import { ViewState, InterviewType, ChatMessage, FinalReport, HistoricalInterviewRecord, CandidateStatus, TranscriptEntry } from './types';
import { aiRecruiterService } from './services/geminiService';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import LiveInterviewScreen from './components/LiveInterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import HrDashboard from './components/HrDashboard';
import useLocalStorage from './hooks/useLocalStorage';
import { MicrosoftIcon, GoogleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, CodeBracketIcon, GaugeIcon, ComputerDesktopIcon, BeakerIcon } from './components/icons';

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
    <div className="w-full bg-[#0f172a] text-white">
      <header className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-sm p-6 z-10">
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
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </header>
      <main>
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-88px)] flex items-center justify-center">
            <div className="container mx-auto text-center px-4 animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
                The Future of Hiring is Here.
                <br />
                <span className="text-blue-400">Smarter, Faster AI-Powered Interviews.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
                Automate interviews, eliminate bias, and identify top candidates effortlessly. Let our AI agent handle the screening, so you can focus on hiring the best.
              </p>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-slate-900/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Smarter Hiring</h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Everything you need to automate and enhance your recruitment process, from start to finish.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up">
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Interviews</h3>
                <p className="text-slate-400 text-center">Conducts both dynamic text-based chats and realistic live voice interviews to engage candidates effectively.</p>
              </div>
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><DocumentTextIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Adaptive Questioning</h3>
                <p className="text-slate-400 text-center">Intelligently generates questions based on the job description and candidate's resume for a tailored assessment.</p>
              </div>
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><GaugeIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Real-time Evaluation</h3>
                <p className="text-slate-400 text-center">Analyzes candidate responses in real-time, providing instant scoring and constructive feedback.</p>
              </div>
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChartBarIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">In-depth Reporting</h3>
                <p className="text-slate-400 text-center">Generates comprehensive reports with overall scores, strength/weakness analysis, and salary suggestions.</p>
              </div>
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ShieldCheckIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Interview Integrity</h3>
                <p className="text-slate-400 text-center">Employs advanced AI proctoring to monitor for cheating, ensuring a fair and authentic evaluation process.</p>
              </div>
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><CodeBracketIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">Interactive Coding Challenges</h3>
                <p className="text-slate-400 text-center">Includes a fully-functional Python IDE for assessing technical skills with hands-on coding exercises.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-[#0f172a]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">A simple four-step process to streamline your recruitment.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><DocumentTextIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">1. Provide Details</h3>
                <p className="text-slate-400 text-center">Upload the job description and candidate's resume to provide context for the AI.</p>
              </div>
              {/* Step 2 */}
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">2. AI Conducts Interview</h3>
                <p className="text-slate-400 text-center">Our AI engages the candidate in a comprehensive text or voice-based interview.</p>
              </div>
              {/* Step 3 */}
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ChartBarIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">3. Get Instant Report</h3>
                <p className="text-slate-400 text-center">Receive a detailed analysis of skills, performance, and salary recommendations.</p>
              </div>
               {/* Step 4 */}
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="bg-blue-500/20 p-4 rounded-full mb-6"><ShieldCheckIcon className="w-10 h-10 text-blue-300"/></div>
                <h3 className="text-xl font-semibold mb-2">4. Ensure Integrity</h3>
                <p className="text-slate-400 text-center">Built-in proctoring ensures response authenticity and fair evaluation for all candidates.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Preparation Guide Section */}
        <section id="prepare" className="py-20 bg-slate-900/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Preparing for Your Interview</h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Follow these guidelines to ensure a smooth and successful AI-powered interview experience.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
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
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
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
              <div className="p-8 bg-slate-800/40 rounded-xl border border-white/10 flex flex-col animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
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
      <footer className="p-6 text-center text-slate-500 bg-[#0f172a]">
        <p>&copy; {new Date().getFullYear()} AI Recruitment Agent. All rights reserved.</p>
      </footer>
    </div>
  );
};


// --- Login Page Component ---
const InterviewIllustration: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 200 150" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="#e2e8f0" rx="10"/>
        <rect x="20" y="20" width="160" height="110" fill="#f8fafc" rx="5"/>
        <circle cx="100" cy="75" r="25" fill="#cbd5e1"/>
        <path d="M85 90 C 90 105, 110 105, 115 90" fill="#94a3b8" />
        <circle cx="90" cy="70" r="3" fill="#475569"/>
        <circle cx="110" cy="70" r="3" fill="#475569"/>
        <rect x="30" y="40" width="30" height="20" rx="3" fill="#4299e1"/><path d="M35,45 l5,5 l10,-10" stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="30" y="90" width="30" height="20" rx="3" fill="#4299e1"/><path d="M35,95 l5,5 l10,-10" stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="140" y="40" width="30" height="20" rx="3" fill="#4299e1"/><path d="M145,45 l5,5 l10,-10" stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="140" y="90" width="30" height="20" rx="3" fill="#4299e1"/><path d="M145,95 l5,5 l10,-10" stroke="#fff" strokeWidth="2" fill="none" />
        <line x1="20" y1="60" x2="180" y2="60" stroke="#cbd5e1" strokeWidth="1" /><line x1="20" y1="80" x2="180" y2="80" stroke="#cbd5e1" strokeWidth="1" />
    </svg>
);

type UserRole = 'Candidate' | 'HR';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Candidate');

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center animate-fade-in">
        <div className="flex justify-center items-center gap-2 mb-4">
            <LandingMicrophoneIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">AI Recruiting Agent</h1>
        </div>
        <div className="my-6"><InterviewIllustration className="w-48 h-auto mx-auto"/></div>
        <h2 className="text-2xl font-semibold mb-2">Welcome Back!</h2>
        <p className="text-slate-500 mb-4">Please select your role to continue.</p>
        <div className="flex bg-slate-200 p-1 rounded-full mb-8 w-full max-w-sm mx-auto">
            <button
                onClick={() => setSelectedRole('Candidate')}
                className={`w-1/2 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedRole === 'Candidate' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:bg-slate-300/70'}`}
            >
                I am a Candidate
            </button>
            <button
                onClick={() => setSelectedRole('HR')}
                className={`w-1/2 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedRole === 'HR' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:bg-slate-300/70'}`}
            >
                I am an HR Professional
            </button>
        </div>
        <div className="space-y-4">
            <button
              onClick={() => onLogin(selectedRole)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-3 text-lg"
            >
              <MicrosoftIcon className="w-6 h-6" />
              <span>Login with Microsoft</span>
            </button>
            <button
              onClick={() => onLogin(selectedRole)}
              className="w-full bg-white hover:bg-gray-100 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-3 text-lg border border-slate-300"
            >
              <GoogleIcon className="w-6 h-6" />
              <span>Login with Google</span>
            </button>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>(ViewState.LANDING);
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [resumeText, setResumeText] = useState<string>('');
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);
    const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.LIVE);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

    const [chatWarningCount, setChatWarningCount] = useState(0);
    const [isChatTerminated, setIsChatTerminated] = useState(false);

    const [mediaStreams, setMediaStreams] = useState<MediaStreams | null>(null);
    const mediaStreamsRef = useRef<MediaStreams | null>(null);

    const [history, setHistory] = useLocalStorage<HistoricalInterviewRecord[]>('interviewHistory', []);
    
    const stopMediaStreams = useCallback(() => {
        if (mediaStreamsRef.current) {
            mediaStreamsRef.current.camera.getTracks().forEach(track => track.stop());
            mediaStreamsRef.current.screen.getTracks().forEach(track => track.stop());
            mediaStreamsRef.current = null;
            setMediaStreams(null);
        }
    }, []);

    const resetState = useCallback(() => {
        stopMediaStreams();
        setViewState(ViewState.SETUP);
        setJobTitle('');
        setJobDescription('');
        setResumeText('');
        setResumeFileName(null);
        setChatHistory([]);
        setFinalReport(null);
        setError(null);
        setIsLoading(false);
        setIsAiResponding(false);
        setChatWarningCount(0);
        setIsChatTerminated(false);
    }, [stopMediaStreams]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setResumeFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setResumeText(text || "File content could not be read.");
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
                setViewState(ViewState.INTERVIEW);
            } catch (e) {
                setError("Failed to start the interview. Please check your API key and try again.");
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
                setViewState(ViewState.LIVE);
            } catch (err) {
                console.error("Failed to get media devices.", err);
                setError("Camera, microphone, and screen sharing access is required for a live interview. Please enable permissions and try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSendMessage = async (message: string) => {
        const newUserMessage: ChatMessage = { role: 'user', content: message };
        
        const proctoringResult = await aiRecruiterService.analyzeTextResponse(message);
        if (proctoringResult.cheating_detected) {
            newUserMessage.proctoringResult = { flagged: true, reason: proctoringResult.reason };
            const newWarningCount = chatWarningCount + 1;
            setChatWarningCount(newWarningCount);
            
            if (newWarningCount >= 2) {
                setChatHistory(prev => [...prev, newUserMessage]);
                setIsChatTerminated(true);
                return;
            }
        }

        const updatedChatHistory = [...chatHistory, newUserMessage];
        setChatHistory(updatedChatHistory);
        setIsAiResponding(true);

        const questionCount = updatedChatHistory.filter(m => m.role === 'ai').length;
        const jobContext = `Job Title: ${jobTitle}\n\n${jobDescription}`;

        if (questionCount >= 11) {
             await generateAndSaveReport(updatedChatHistory, message);
        } else {
            try {
                const { analysis, nextQuestion } = await aiRecruiterService.getNextStep(updatedChatHistory, jobContext, resumeText);
                
                const lastUserMessageIndex = updatedChatHistory.length - 1;
                const historyWithAnalysis = [...updatedChatHistory];
                historyWithAnalysis[lastUserMessageIndex].analysis = analysis;

                const newAiMessage: ChatMessage = { 
                    role: 'ai', 
                    content: nextQuestion.question_text,
                    is_coding_challenge: nextQuestion.is_coding_challenge,
                };
                setChatHistory([...historyWithAnalysis, newAiMessage]);

            } catch (e) {
                setError("Failed to get the next question.");
                console.error(e);
                const errorMessage: ChatMessage = { role: 'ai', content: "I'm sorry, I encountered an error. Let's try restarting the interview." };
                setChatHistory(prev => [...prev, errorMessage]);
            } finally {
                setIsAiResponding(false);
            }
        }
    };

    const generateAndSaveReport = async (finalChatHistory: ChatMessage[], codeSubmission?: string) => {
        try {
            setViewState(ViewState.RESULTS); 
            const lastAiMessage = finalChatHistory.filter(m => m.role === 'ai').pop();
            const submission = lastAiMessage?.is_coding_challenge ? codeSubmission : undefined;
            
            const jobContext = `Job Title: ${jobTitle}\n\n${jobDescription}`;

            const report = await aiRecruiterService.generateFinalReport(finalChatHistory, jobContext, resumeText, submission);
            setFinalReport(report);
            
             const newRecord: HistoricalInterviewRecord = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                jobTitle: jobTitle,
                resumeFileName: resumeFileName || "Unknown",
                jobDescriptionSnippet: jobDescription.substring(0, 100) + "...",
                report: report,
                status: CandidateStatus.PENDING,
            };
            setHistory(prev => [...prev, newRecord]);

        } catch (e) {
            setError("Failed to generate the final report.");
            console.error(e);
            setViewState(ViewState.INTERVIEW); 
        } finally {
            setIsAiResponding(false);
        }
    }

    const handleEndLiveInterview = async (transcript: TranscriptEntry[], code: string) => {
        stopMediaStreams();
        const chatLikeTranscript: ChatMessage[] = transcript.map(t => ({ role: t.speaker, content: t.text }));
        await generateAndSaveReport(chatLikeTranscript, code);
    }
    
    const handleUpdateRecord = (id: string, newStatus: CandidateStatus, newNotes: string) => {
        setHistory(prev => prev.map(rec => rec.id === id ? {...rec, status: newStatus, notes: newNotes} : rec));
    }

    const handleLogin = (role: UserRole) => {
      if (role === 'HR') {
        setViewState(ViewState.HISTORY);
      } else {
        setViewState(ViewState.SETUP);
      }
    };

    let currentView;
    switch (viewState) {
        case ViewState.LANDING:
            currentView = <LandingPage onLoginClick={() => setViewState(ViewState.LOGIN)} />;
            break;
        case ViewState.LOGIN:
            currentView = <LoginPage onLogin={handleLogin} />;
            break;
        case ViewState.INTERVIEW:
            currentView = <InterviewScreen 
                        chatHistory={chatHistory} 
                        onSendMessage={handleSendMessage} 
                        isAiResponding={isAiResponding}
                        questionCount={chatHistory.filter(m => m.role === 'ai').length}
                        onRestart={resetState}
                        warningCount={chatWarningCount}
                        isTerminated={isChatTerminated}
                        onConfirmTermination={resetState}
                   />;
            break;
        case ViewState.RESULTS:
            currentView = <ResultsScreen report={finalReport} onRestart={resetState} isLoading={!finalReport} />;
            break;
        case ViewState.HISTORY:
            currentView = <HrDashboard records={history} onBack={() => setViewState(ViewState.SETUP)} onUpdateRecord={handleUpdateRecord} />;
            break;
        case ViewState.LIVE:
            currentView = <LiveInterviewScreen
                        mediaStreams={mediaStreams}
                        onEndInterview={handleEndLiveInterview}
                        jobDescription={`Job Title: ${jobTitle}\n\n${jobDescription}`}
                        resumeText={resumeText}
                        onRestart={resetState}
                    />;
            break;
        case ViewState.SETUP:
        default:
            currentView = <SetupScreen 
                        jobTitle={jobTitle}
                        setJobTitle={setJobTitle}
                        jobDescription={jobDescription}
                        setJobDescription={setJobDescription}
                        onStart={handleStartInterview}
                        isLoading={isLoading}
                        // Fix: Corrected typo from onFilechange to onFileChange.
                        onFileChange={handleFileChange}
                        resumeFileName={resumeFileName}
                        onRemoveResume={() => { setResumeFileName(null); setResumeText(''); }}
                        interviewType={interviewType}
                        setInterviewType={setInterviewType}
                        error={error}
                        onViewHistory={() => setViewState(ViewState.HISTORY)}
                   />;
            break;
    }

    return (
        <>
            {currentView}
        </>
    );
};

export default App;
