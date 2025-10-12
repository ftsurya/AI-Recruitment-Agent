import React, { useState } from 'react';
import { InterviewType, InterviewTemplate, User } from '../types';
import Spinner from './Spinner';
import { UploadIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from './icons';

interface SetupScreenProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  jobTitle: string;
  setJobTitle: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  candidateEmail: string;
  setCandidateEmail: (value: string) => void;
  onStart: () => void;
  isLoading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resumeFileName: string | null;
  onRemoveResume: () => void;
  interviewType: InterviewType;
  setInterviewType: (type: InterviewType) => void;
  // Template props
  templates: InterviewTemplate[];
  onLoadTemplate: (template: InterviewTemplate) => void;
  // User props
  currentUser: User | null;
  onLogout: () => void;
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
            className={`p-6 border rounded-xl text-left transition-all duration-300 w-full bg-white/5 backdrop-blur-md hover:bg-white/10
                ${ selected
                        ? 'border-blue-400 ring-2 ring-blue-400/50'
                        : 'border-white/10'
                }
            `}
        >
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </button>
    )
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  companyName,
  jobTitle,
  jobDescription,
  candidateEmail,
  setCandidateEmail,
  onStart,
  isLoading,
  onFileChange,
  resumeFileName,
  onRemoveResume,
  interviewType,
  setInterviewType,
  templates,
  onLoadTemplate,
  currentUser,
  onLogout
}) => {
  const isStartDisabled = !companyName.trim() || !jobTitle.trim() || !candidateEmail.trim() || !jobDescription.trim() || !resumeFileName || isLoading;

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === templateId);
    if (template) {
        onLoadTemplate(template);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white animate-fade-in bg-transparent relative">
      <header className="absolute top-0 right-0 p-6 flex items-center gap-4">
        {currentUser && (
            <div className="flex items-center gap-2 text-slate-300">
                <UserCircleIcon className="w-6 h-6" />
                <span>{currentUser.name}</span>
            </div>
        )}
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
            <ArrowRightOnRectangleIcon className="w-4 h-4"/>
            Logout
        </button>
    </header>

      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100">
            AI Recruitment Agent
          </h1>
          <p className="text-slate-400 text-lg mt-2">
            Select a template, enter the candidate's details, and begin the interview.
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-slide-in-up">
           {/* Template Loader */}
           {templates.length > 0 && (
                <div className="mb-6">
                    <label htmlFor="template-select" className="block text-sm font-medium text-slate-300 mb-1">JOB TITLE</label>
                    <select
                        id="template-select"
                        onChange={handleTemplateSelect}
                        className="w-full p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-300 text-sm"
                        defaultValue=""
                    >
                        <option value="" disabled>Select a template to populate job details...</option>
                        {templates.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.name} ({t.companyName})</option>)}
                    </select>
                </div>
           )}

            {/* Candidate Email */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-3">Candidate Email</h2>
                <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="e.g., alex.johnson@example.com"
                    className="w-full p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-300 placeholder-slate-500 text-sm"
                    disabled={isLoading}
                    required
                />
            </div>
            
            {/* Resume Upload */}
            <div className="mb-6">
                 <h2 className="text-lg font-semibold text-slate-200 mb-3">Candidate Resume (PDF, TXT, DOCX)</h2>
                 <div className="h-64">
                 {resumeFileName ? (
                    <div className="bg-green-500/10 backdrop-blur-md border border-green-500/50 rounded-lg h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="font-semibold text-green-300">{resumeFileName}</p>
                        <p className="text-xs text-slate-400 mt-1">File successfully loaded.</p>
                        <button onClick={onRemoveResume} disabled={isLoading} className="mt-4 px-4 py-2 bg-red-600/80 text-white text-xs font-bold rounded-md hover:bg-red-600 transition-colors">
                            Remove File
                        </button>
                    </div>
                ) : (
                    <label className="relative border-2 border-dashed border-slate-600 rounded-lg h-full flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors bg-black/20 backdrop-blur-sm cursor-pointer">
                        <input
                            type="file"
                            onChange={onFileChange}
                            accept=".pdf,.docx,.txt"
                            className="absolute top-0 left-0 w-full h-full opacity-0"
                            disabled={isLoading}
                        />
                         <div className="flex flex-col items-center justify-center w-full h-full">
                           <UploadIcon className="w-10 h-10 text-slate-500 mb-2"/>
                           <p className="text-slate-400">Click to upload resume</p>
                        </div>
                    </label>
                )}
                </div>
            </div>

            {/* Interview Mode */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-center text-slate-200 mb-4">Interview Mode</h2>
                <div className="flex flex-col md:flex-row justify-center gap-4">
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
             
            {(interviewType === InterviewType.LIVE || interviewType === InterviewType.CHAT) && (
                <div className="mt-6 bg-yellow-900/30 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 flex items-start gap-4 animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 className="font-semibold text-yellow-300">Proctoring is Always Enabled</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          To ensure a fair and authentic evaluation, all interviews are monitored for integrity. For live interviews, this includes webcam and screen analysis. For chat interviews, responses are checked for plagiarism. Please close all unnecessary applications before starting.
                        </p>
                    </div>
                </div>
            )}


            <div className="mt-8">
                <button
                    onClick={onStart}
                    disabled={isStartDisabled}
                    className={`w-full max-w-xs mx-auto text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center
                        ${isStartDisabled
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600/40 backdrop-blur-md border border-blue-400/60 hover:bg-blue-500/60 text-white shadow-lg shadow-blue-500/30'
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