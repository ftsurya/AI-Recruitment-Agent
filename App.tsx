import React, { useState, useCallback, useRef } from 'react';
import { ViewState, InterviewType, ChatMessage, FinalReport, HistoricalInterviewRecord, CandidateStatus, TranscriptEntry } from './types';
import { aiRecruiterService } from './services/geminiService';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import LiveInterviewScreen from './components/LiveInterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import HrDashboard from './components/HrDashboard';
import useLocalStorage from './hooks/useLocalStorage';

interface MediaStreams {
    camera: MediaStream;
    screen: MediaStream;
}

const App: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>(ViewState.SETUP);
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

    // Proctoring State
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
        
        // Proctoring check before processing the message
        const proctoringResult = await aiRecruiterService.analyzeTextResponse(message);
        if (proctoringResult.cheating_detected) {
            newUserMessage.proctoringResult = {
                flagged: true,
                reason: proctoringResult.reason,
            };
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
            // Check if the last question was a coding challenge to pass the submission
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
        const chatLikeTranscript: ChatMessage[] = transcript.map(t => ({
            role: t.speaker,
            content: t.text
        }));
        await generateAndSaveReport(chatLikeTranscript, code);
    }
    
    const handleUpdateRecord = (id: string, newStatus: CandidateStatus, newNotes: string) => {
        setHistory(prev => prev.map(rec => rec.id === id ? {...rec, status: newStatus, notes: newNotes} : rec));
    }

    let currentView;
    switch (viewState) {
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