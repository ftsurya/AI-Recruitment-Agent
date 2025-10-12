import React, { useState, useCallback, useRef } from 'react';
import { ViewState, InterviewType, ChatMessage, FinalReport, HistoricalInterviewRecord, CandidateStatus, TranscriptEntry, InterviewTemplate, User } from './types';
import { aiRecruiterService } from './services/geminiService';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import LiveInterviewScreen from './components/LiveInterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import HrDashboard from './components/HrDashboard';
import useLocalStorage from './hooks/useLocalStorage';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, CodeBracketIcon, GaugeIcon, ComputerDesktopIcon, BeakerIcon, RobotIcon, UserCircleIcon, BuildingOfficeIcon, MicrosoftIcon } from './components/icons';

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
type UserRole = 'Candidate' | 'HR';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLogin = () => {
    if (selectedRole === 'Candidate') {
      onLogin({ name: 'Alex Johnson', role: 'Candidate' });
    } else if (selectedRole === 'HR') {
      onLogin({ name: 'Sarah Chen', role: 'HR' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center w-full max-w-lg mx-auto">
        <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-6 ring-1 ring-blue-500/20">
          <RobotIcon className="w-12 h-12 text-blue-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome</h1>
        <p className="text-md text-slate-400 mb-8">Please select your role and sign in to continue.</p>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <button
            onClick={() => setSelectedRole('Candidate')}
            className={`group bg-slate-800/50 hover:bg-slate-700/60 border rounded-xl p-6 text-left transition-all duration-300 flex items-center gap-4
              ${selectedRole === 'Candidate' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700'}`}
          >
            <UserCircleIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <div><h2 className="text-lg font-semibold text-slate-100">I'm a Candidate</h2></div>
          </button>
          <button
            onClick={() => setSelectedRole('HR')}
            className={`group bg-slate-800/50 hover:bg-slate-700/60 border rounded-xl p-6 text-left transition-all duration-300 flex items-center gap-4
              ${selectedRole === 'HR' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700'}`}
          >
            <BuildingOfficeIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <div><h2 className="text-lg font-semibold text-slate-100">I'm an HR Professional</h2></div>
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="h-14 flex items-center justify-center">
          {selectedRole === 'Candidate' && (
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 animate-fade-in"
            >
              <MicrosoftIcon className="w-5 h-5" />
              Login as Candidate with Microsoft (ID 1)
            </button>
          )}
          {selectedRole === 'HR' && (
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 animate-fade-in"
            >
              <MicrosoftIcon className="w-5 h-5" />
              Login as HR Professional with Microsoft (ID 2)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>(ViewState.LANDING);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companyName, setCompanyName] = useState<string>('');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [candidateEmail, setCandidateEmail] = useState<string>('');
    const [resumeText, setResumeText] = useState<string>('');
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);
    const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.CHAT);
    
    // Interview Customization State
    const [totalQuestions, setTotalQuestions] = useState<number>(11);
    const [technicalRatio, setTechnicalRatio] = useState<number>(50); // As a percentage
    const [customQuestions, setCustomQuestions] = useState<string>('');

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
    const [templates, setTemplates] = useLocalStorage<InterviewTemplate[]>('interviewTemplates', []);
    
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
        setChatHistory([]);
        setFinalReport(null);
        setError(null);
        setIsLoading(false);
        setIsAiResponding(false);
        setChatWarningCount(0);
        setIsChatTerminated(false);
    }, [stopMediaStreams]);

    const handleRestart = useCallback(() => {
        clearInterviewState();
        setViewState(ViewState.SETUP);
    }, [clearInterviewState]);

    const handleLogout = useCallback(() => {
        clearInterviewState();
        setCurrentUser(null);
        setViewState(ViewState.LANDING);
    }, [clearInterviewState]);
    
    const handleUpdateRecord = (recordId: string, updatedFields: Partial<HistoricalInterviewRecord>) => {
        setHistory(prevHistory => 
            prevHistory.map(record => 
                record.id === recordId ? { ...record, ...updatedFields } : record
            )
        );
    };

    const handleCandidateIdle = () => {
        if (isAiResponding) return;
        
        const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
    
        if (lastMessage && lastMessage.role === 'ai' && !lastMessage.isNudge) {
            const nudgeMessage: ChatMessage = {
                role: 'ai',
                content: "Just checking in, are you still there? Please take your time to respond.",
                isNudge: true
            };
            setChatHistory(prev => [...prev, nudgeMessage]);
        }
    };


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
                const firstMessage = await aiRecruiterService.generateFirstQuestion(jobContext, resumeText, totalQuestions);
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

        if (questionCount >= totalQuestions) {
             await generateAndSaveReport(updatedChatHistory, message);
        } else {
            try {
                const { analysis, nextQuestion } = await aiRecruiterService.getNextStep(updatedChatHistory, jobContext, resumeText, totalQuestions, technicalRatio, customQuestions);
                
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

    const generateAndSaveReport = async (
        finalChatHistory: ChatMessage[], 
        codeSubmission?: string, 
        videoUrl?: string,
        liveTranscript?: TranscriptEntry[]
    ) => {
        try {
            setViewState(ViewState.RESULTS); 
            const lastAiMessage = finalChatHistory.filter(m => m.role === 'ai').pop();
            const submission = lastAiMessage?.is_coding_challenge ? codeSubmission : undefined;
            
            const jobContext = `Job Title: ${jobTitle}\n\n${jobDescription}`;

            const report = await aiRecruiterService.generateFinalReport(finalChatHistory, jobContext, resumeText, submission);
            setFinalReport(report);
            
            const transcriptToSave = liveTranscript || finalChatHistory.map(m => ({ speaker: m.role, text: m.content }));
            
             const newRecord: HistoricalInterviewRecord = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                jobTitle: jobTitle,
                candidateName: currentUser?.name,
                candidateEmail: candidateEmail,
                resumeFileName: resumeFileName || "Unknown",
                resumeText: resumeText,
                jobDescriptionSnippet: jobDescription.substring(0, 100) + "...",
                report: report,
                status: CandidateStatus.PENDING,
                videoRecordingUrl: videoUrl,
                transcript: transcriptToSave,
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

    const handleEndLiveInterview = async (transcript: TranscriptEntry[], code: string, videoUrl: string) => {
        stopMediaStreams();
        const chatLikeTranscript: ChatMessage[] = transcript.map(t => ({ role: t.speaker, content: t.text }));
        await generateAndSaveReport(chatLikeTranscript, code, videoUrl, transcript);
    }
    
    const handleLogin = (user: User) => {
      setCurrentUser(user);
      if (user.role === 'HR') {
        setViewState(ViewState.HISTORY);
      } else {
        setViewState(ViewState.SETUP);
      }
    };

    const handleLoadTemplate = (template: InterviewTemplate) => {
        setCompanyName(template.companyName);
        setJobTitle(template.jobTitle);
        setJobDescription(template.jobDescription);
        setTotalQuestions(template.totalQuestions);
        setTechnicalRatio(template.technicalRatio);
        setCustomQuestions(template.customQuestions);
    };

    // --- Template CRUD Handlers ---
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
                        onRestart={handleRestart}
                        warningCount={chatWarningCount}
                        isTerminated={isChatTerminated}
                        onConfirmTermination={handleRestart}
                        currentUser={currentUser}
                        onCandidateIdle={handleCandidateIdle}
                   />;
            break;
        case ViewState.RESULTS:
            currentView = <ResultsScreen report={finalReport} onRestart={handleRestart} isLoading={!finalReport} />;
            break;
        case ViewState.HISTORY:
            currentView = <HrDashboard 
                            records={history} 
                            templates={templates}
                            onAddTemplate={handleAddTemplate}
                            onUpdateTemplate={handleUpdateTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                            onLogout={handleLogout} 
                            onUpdateRecord={handleUpdateRecord}
                            currentUser={currentUser}
                          />;
            break;
        case ViewState.LIVE:
            currentView = <LiveInterviewScreen
                        mediaStreams={mediaStreams}
                        onEndInterview={handleEndLiveInterview}
                        jobDescription={`Job Title: ${jobTitle}\n\n${jobDescription}`}
                        resumeText={resumeText}
                        onRestart={handleRestart}
                        currentUser={currentUser}
                    />;
            break;
        case ViewState.SETUP:
        default:
            currentView = <SetupScreen 
                        companyName={companyName}
                        setCompanyName={setCompanyName}
                        jobTitle={jobTitle}
                        setJobTitle={setJobTitle}
                        jobDescription={jobDescription}
                        setJobDescription={setJobDescription}
                        candidateEmail={candidateEmail}
                        setCandidateEmail={setCandidateEmail}
                        onStart={handleStartInterview}
                        isLoading={isLoading}
                        onFileChange={handleFileChange}
                        resumeFileName={resumeFileName}
                        onRemoveResume={() => { setResumeFileName(null); setResumeText(''); }}
                        interviewType={interviewType}
                        setInterviewType={setInterviewType}
                        error={error}
                        totalQuestions={totalQuestions}
                        setTotalQuestions={setTotalQuestions}
                        technicalRatio={technicalRatio}
                        setTechnicalRatio={setTechnicalRatio}
                        customQuestions={customQuestions}
                        setCustomQuestions={setCustomQuestions}
                        templates={templates}
                        onLoadTemplate={handleLoadTemplate}
                        currentUser={currentUser}
                        onLogout={handleLogout}
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