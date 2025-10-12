import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types';
import Spinner from './Spinner';
import { ExclamationTriangleIcon } from './icons';

interface InterviewScreenProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isAiResponding: boolean;
  questionCount: number;
  onRestart: () => void;
  warningCount: number;
  isTerminated: boolean;
  onConfirmTermination: () => void;
  currentUser: User | null;
  onCandidateIdle: () => void;
  isDeeplyIdle: boolean;
  onContinueInterview: () => void;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isAI = message.role === 'ai';
  const score = message.analysis?.answer_score;
  const isFlagged = message.proctoringResult?.flagged;

  const scoreColor = score !== undefined 
    ? score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-400';

  return (
    <div className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      {isAI && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0"></div>}
      <div className={`max-w-2xl p-4 rounded-2xl ${isAI ? 'bg-slate-700 text-slate-200 rounded-bl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.analysis && (
          <div className="mt-3 pt-3 border-t border-white/20 text-xs">
            <p className="font-bold">Feedback: <span className="font-normal italic">{message.analysis.comments}</span></p>
            <p className="font-bold">Score: <span className={`font-bold ${scoreColor}`}>{message.analysis.answer_score}/100</span></p>
          </div>
        )}
      </div>
      {isFlagged && (
        <div className="text-yellow-400" title={`Flagged: ${message.proctoringResult?.reason}`}>
            <ExclamationTriangleIcon className="w-5 h-5"/>
        </div>
      )}
    </div>
  );
};

const CodeEditor: React.FC<{ code: string, setCode: (c: string) => void, disabled: boolean }> = ({ code, setCode, disabled }) => {
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg p-2 font-mono text-sm">
      <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-t-md text-xs">Python IDE</div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="This is a coding environment. Please write your Python code here."
        className="w-full h-48 bg-slate-900 text-slate-200 p-3 rounded-b-md focus:outline-none resize-none"
        disabled={disabled}
      />
    </div>
  )
}

const WarningModal: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/20 border-2 border-yellow-400 text-yellow-200 px-8 py-4 rounded-lg shadow-2xl z-50 animate-fade-in">
        <p className="text-lg font-bold">{message}</p>
    </div>
);

const TerminationModal: React.FC<{ onConfirmEnd: () => void }> = ({ onConfirmEnd }) => (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-50 animate-fade-in">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Interview Terminated</h2>
        <p className="text-slate-300 mb-8">The interview has been terminated due to repeated policy violations.</p>
        <button onClick={onConfirmEnd} className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
            Return to Setup
        </button>
    </div>
);

const DeepIdleModal: React.FC<{ onContinue: () => void; onRestart: () => void }> = ({ onContinue, onRestart }) => (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-50 animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-200 mb-4">Are you still there?</h2>
        <p className="text-slate-400 mb-8 max-w-md">The interview has been paused due to inactivity. You can continue where you left off or restart the session.</p>
        <div className="flex gap-4">
            <button onClick={onRestart} className="px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors">
                Restart Interview
            </button>
            <button onClick={onContinue} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors">
                I'm Back, Continue
            </button>
        </div>
    </div>
);


const InterviewScreen: React.FC<InterviewScreenProps> = ({
  chatHistory,
  onSendMessage,
  isAiResponding,
  questionCount,
  onRestart,
  warningCount,
  isTerminated,
  onConfirmTermination,
  currentUser,
  onCandidateIdle,
  isDeeplyIdle,
  onContinueInterview,
}) => {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  
  const isCodingActive = chatHistory[chatHistory.length - 1]?.is_coding_challenge ?? false;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  useEffect(() => {
    if (warningCount > 0 && warningCount < 2) {
        setShowWarning(true);
        const timer = setTimeout(() => setShowWarning(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [warningCount]);

  // Effect for handling candidate inactivity
  useEffect(() => {
    // Clear any existing timer when dependencies change
    if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
    }

    const lastMessage = chatHistory[chatHistory.length - 1];
    // Set a timer if the last message was from the AI and the modal isn't already showing.
    if (lastMessage?.role === 'ai' && !isAiResponding && !isDeeplyIdle) {
        idleTimerRef.current = window.setTimeout(() => {
            onCandidateIdle();
        }, 60000); // 60 seconds
    }

    // Cleanup function to clear the timer
    return () => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
    };
  }, [chatHistory, isAiResponding, onCandidateIdle, isDeeplyIdle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear the inactivity timer as soon as the user submits
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    
    const messageToSend = isCodingActive ? code : input;
    if (messageToSend.trim() && !isAiResponding) {
      onSendMessage(messageToSend);
      setInput('');
      if (!isCodingActive) {
        setCode('');
      }
    }
  };

  const totalSections = 6; // Based on the new interview flow
  const progress = Math.min((questionCount / (totalSections-1)) * 100, 100);

  return (
    <div className="relative h-screen w-full flex flex-col text-white bg-[#0f172a]">
      {showWarning && <WarningModal message="Warning: Your response has been flagged for review." />}
      {isTerminated && <TerminationModal onConfirmEnd={onConfirmTermination} />}
      {isDeeplyIdle && <DeepIdleModal onContinue={onContinueInterview} onRestart={onRestart} />}


      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div>
            <h1 className="text-xl font-bold text-slate-100">AI Interview for {currentUser?.name || 'Candidate'}</h1>
            <p className="text-sm text-blue-300">Section {questionCount + 1} of {totalSections}</p>
        </div>
        <button onClick={onRestart} className="px-3 py-1 text-sm font-medium text-blue-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 8.5M20 20l-1.5-1.5A9 9 0 003.5 15.5" /></svg>
            Restart
        </button>
      </header>

       {/* Progress Bar */}
        <div className="w-full bg-slate-700 h-2">
            <div className="bg-blue-500 h-2" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
        {chatHistory.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
        {isAiResponding && (
          <div className="flex justify-start items-end gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0"></div>
             <div className="bg-slate-700 p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <form onSubmit={handleSubmit}>
           {isCodingActive ? (
             <CodeEditor code={code} setCode={setCode} disabled={isAiResponding} />
           ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full bg-slate-800 border border-slate-600 rounded-full py-3 pl-5 pr-14 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-200 placeholder-slate-500"
              disabled={isAiResponding}
            />
           )}
          <button
            type="submit"
            disabled={isAiResponding || (isCodingActive ? !code.trim() : !input.trim())}
            className="w-full mt-3 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isCodingActive ? 'Submit Code' : 'Send Answer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewScreen;
