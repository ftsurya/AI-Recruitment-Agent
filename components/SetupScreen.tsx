import React from 'react';
import { InterviewType } from '../types';
import Spinner from './Spinner';
import { UploadIcon, FileIcon, XCircleIcon, BriefcaseIcon, DocumentTextIcon, VideoCameraIcon, ChatBubbleLeftRightIcon } from './icons';

interface SetupScreenProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  onStart: () => void;
  isLoading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resumeFileName: string | null;
  onRemoveResume: () => void;
  interviewType: InterviewType;
  setInterviewType: (type: InterviewType) => void;
  error: string | null;
  onViewHistory: () => void;
}

const InterviewTypeButton: React.FC<{
    type: InterviewType;
    title: string;
    description: string;
    selected: boolean;
    onSelect: (type: InterviewType) => void;
}> = ({ type, title, description, selected, onSelect }) => {
    return (
        <button
            onClick={() => onSelect(type)}
            className={`px-6 py-3 border rounded-lg text-left transition-all duration-300 w-full
                ${ selected
                        ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                }
            `}
        >
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </button>
    )
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  jobDescription,
  setJobDescription,
  onStart,
  isLoading,
  onFileChange,
  resumeFileName,
  onRemoveResume,
  interviewType,
  setInterviewType,
  error,
  onViewHistory,
}) => {
  const isStartDisabled = !jobDescription.trim() || !resumeFileName || isLoading;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white animate-fade-in">
       <div className="absolute top-6 right-6">
        <button
          onClick={onViewHistory}
          className="px-4 py-2 text-sm font-semibold text-slate-200 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          History
        </button>
      </div>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100">
            AI Recruitment Agent
          </h1>
          <p className="text-slate-400 text-lg mt-2">
            Enter the job details and candidate resume to begin the interview.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-slide-in-up">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Job Description */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-3">Job Description</h2>
                     <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste full job description here..."
                        className="w-full h-64 p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-300 placeholder-slate-500 text-sm"
                        disabled={isLoading}
                    />
                </div>
               
               {/* Resume Upload */}
                <div>
                     <h2 className="text-lg font-semibold text-slate-200 mb-3">Candidate Resume (PDF)</h2>
                     <div className="h-64">
                     {resumeFileName ? (
                        <div className="bg-slate-800 border border-green-500/50 rounded-lg h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="font-semibold text-green-300">{resumeFileName}</p>
                            <p className="text-xs text-slate-400 mt-1">PDF successfully processed.</p>
                            <button onClick={onRemoveResume} disabled={isLoading} className="mt-4 px-4 py-2 bg-red-600/80 text-white text-xs font-bold rounded-md hover:bg-red-600 transition-colors">
                                Remove File
                            </button>
                        </div>
                    ) : (
                        <div className="relative border-2 border-dashed border-slate-600 rounded-lg h-full flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors bg-slate-800/50">
                            <input
                                type="file"
                                onChange={onFileChange}
                                accept=".pdf,.docx,.txt"
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isLoading}
                            />
                             <div className="flex items-center justify-center w-full h-full">
                               <p className="text-slate-400">Click to upload resume</p>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
           </div>

            {/* Interview Mode */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-center text-slate-200 mb-4">Interview Mode</h2>
                <div className="flex justify-center gap-4">
                     <InterviewTypeButton
                        type={InterviewType.CHAT}
                        title="Chat"
                        description="A text-based interview with an AI, including one coding challenge."
                        selected={interviewType === InterviewType.CHAT}
                        onSelect={setInterviewType}
                    />
                     <InterviewTypeButton
                        type={InterviewType.LIVE}
                        title="Live Voice"
                        description="A real-time, spoken conversation with an AI. Requires mic & camera."
                        selected={interviewType === InterviewType.LIVE}
                        onSelect={setInterviewType}
                    />
                </div>
            </div>
             
             {interviewType === InterviewType.LIVE && (
                <div className="mt-6 bg-slate-800/50 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-4 animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 className="font-semibold text-yellow-300">Proctoring Enabled for Live Interviews</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            To ensure a fair evaluation, live interviews are monitored using your webcam and screen sharing. The system will check for mobile phone usage or other prohibited activities. Please close all unnecessary applications before starting.
                        </p>
                    </div>
                </div>
            )}

            {interviewType === InterviewType.CHAT && (
                <div className="mt-6 bg-slate-800/50 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-4 animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 className="font-semibold text-yellow-300">Proctoring Enabled for Chat Interviews</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            To ensure the integrity of your responses, all submissions are automatically analyzed for plagiarism and AI-generated content. Please use your own words.
                        </p>
                    </div>
                </div>
            )}


            <div className="mt-8">
                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                <button
                    onClick={onStart}
                    disabled={isStartDisabled}
                    className={`w-full max-w-xs mx-auto text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center
                        ${isStartDisabled
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                        }`}
                >
                {isLoading ? (
                    <>
                    <Spinner size="sm" />
                    <span className="ml-3">Starting...</span>
                    </>
                ) : (
                    'Start Interview'
                )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;