import React, { useState, useMemo, Dispatch, SetStateAction, useRef, useEffect } from 'react';
import { HistoricalInterviewRecord, CandidateStatus, FinalReport, InterviewTemplate, User, TranscriptEntry } from '../types';
import StarRating from './StarRating';
import Spinner from './Spinner';
import { XIcon, EnvelopeIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, UserCircleIcon, DocumentArrowDownIcon, VideoCameraIcon } from './icons';
import { aiRecruiterService } from '../services/geminiService';

// --- Sub-components defined in the same file as per instructions ---

type HrTab = 'list' | 'analytics' | 'templates';

// --- Reusable UI Elements for Modals ---
const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">{title}</h3>
        <div className="text-slate-300 text-sm">{children}</div>
    </div>
);

const Pill: React.FC<{ text: string; color: 'green' | 'red' }> = ({ text, color }) => {
    const colorClasses = color === 'green' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300';
    return <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}>{text}</span>
};

const ScoreVisual: React.FC<{ score: number }> = ({ score }) => {
    const size = 40;
    const strokeWidth = 4;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let colorClass = 'stroke-green-500';
    if (score < 50) colorClass = 'stroke-red-500';
    else if (score < 75) colorClass = 'stroke-yellow-500';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="stroke-slate-700"
                    cx={center} cy={center} r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <circle
                    className={`${colorClass} transition-all duration-1000 ease-out`}
                    cx={center} cy={center} r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}</span>
        </div>
    )
}

// --- Video Playback Modal Component (NEW) ---
const VideoPlaybackModal: React.FC<{ record: HistoricalInterviewRecord, onClose: () => void }> = ({ record, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const transcriptContainerRef = useRef<HTMLDivElement>(null);
    const [activeTranscriptIndex, setActiveTranscriptIndex] = useState(-1);

    const handleTimeUpdate = () => {
        if (!videoRef.current || !record.transcript) return;
        const currentTime = videoRef.current.currentTime;
        
        const currentIndex = record.transcript.findIndex((entry, i) => {
            const nextTimestamp = record.transcript?.[i + 1]?.timestamp ?? Infinity;
            return entry.timestamp !== undefined && currentTime >= entry.timestamp && currentTime < nextTimestamp;
        });

        if (currentIndex !== -1 && currentIndex !== activeTranscriptIndex) {
            setActiveTranscriptIndex(currentIndex);
            const activeElement = transcriptContainerRef.current?.children[currentIndex];
            activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Interview Recording: {record.candidateName}</h2>
                        <p className="text-sm text-slate-400">{record.jobTitle}</p>
                    </div>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0">
                    <div className="flex-1 bg-black rounded-lg">
                        {record.videoRecordingUrl ? (
                             <video 
                                ref={videoRef} 
                                src={record.videoRecordingUrl} 
                                controls 
                                className="w-full h-full rounded-lg"
                                onTimeUpdate={handleTimeUpdate}
                             />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">Video not available.</div>
                        )}
                    </div>
                    <div className="w-full md:w-1/3 flex flex-col bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold p-3 border-b border-slate-700 flex-shrink-0">Transcript</h3>
                        <div ref={transcriptContainerRef} className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                           {(record.transcript || []).map((entry, index) => (
                               <div key={index} className={`p-2 rounded-lg transition-colors duration-300 ${activeTranscriptIndex === index ? 'bg-blue-500/20' : ''}`}>
                                   <span className={`font-bold text-sm ${entry.speaker === 'user' ? 'text-slate-300' : 'text-blue-300'}`}>
                                       {entry.speaker === 'user' ? (record.candidateName || 'Candidate') : 'Interviewer'}:
                                   </span>
                                   <p className="text-sm text-slate-400">{entry.text}</p>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Candidate Profile Modal Component ---
const CandidateProfileModal: React.FC<{ record: HistoricalInterviewRecord, onClose: () => void }> = ({ record, onClose }) => {
    const { feedback, salary } = record.report;
    const recommendationColor = feedback.final_recommendation.toLowerCase().includes('hire') ? 'text-green-400'
        : feedback.final_recommendation.toLowerCase().includes('reservations') ? 'text-yellow-400'
        : feedback.final_recommendation.toLowerCase().includes('future') ? 'text-blue-300'
        : 'text-slate-300';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Candidate Profile: {record.candidateName || record.resumeFileName}</h2>
                        <p className="text-sm text-slate-400">{record.jobTitle}</p>
                    </div>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="overflow-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-2 bg-slate-900/50 border border-slate-700 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                            <h2 className="text-xl font-bold mb-2">Overall Score</h2>
                            <p className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-3">{feedback.overall_score}</p>
                            <StarRating rating={feedback.star_rating} size="md" />
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-xl flex flex-col justify-center text-center">
                            <h2 className="text-md font-semibold text-slate-300 mb-2">Recommendation</h2>
                            <p className={`text-xl font-bold ${recommendationColor}`}>{feedback.final_recommendation}</p>
                            <p className="text-xs text-slate-400 mt-2">Experience: {feedback.inferred_experience_level}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <InfoCard title="Strengths">
                            <div className="flex flex-wrap gap-2">
                                {feedback.strengths.map((s, i) => <Pill key={i} text={s} color="green"/>)}
                            </div>
                        </InfoCard>
                        <InfoCard title="Areas for Improvement">
                            <div className="flex flex-wrap gap-2">
                                {feedback.weaknesses.map((w, i) => <Pill key={i} text={w} color="red"/>)}
                            </div>
                        </InfoCard>
                        <InfoCard title="Recommendation Justification">
                            <p className="italic">"{feedback.recommendation_justification}"</p>
                        </InfoCard>
                        <InfoCard title="Behavioral Analysis">
                            <p>{feedback.behavioral_analysis}</p>
                        </InfoCard>
                        <div className="lg:col-span-2">
                            <InfoCard title="Suggested Salary & Compensation">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div>
                                        <p className="text-2xl font-bold text-green-400">{salary.salary_range}</p>
                                        <p className="text-slate-400 text-xs mt-1">{salary.justification}</p>
                                    </div>
                                    <div className="mt-3 sm:mt-0 text-left sm:text-right text-xs">
                                        <p><strong>Base:</strong> {salary.breakdown.base_salary}</p>
                                        <p><strong>Bonus:</strong> {salary.breakdown.bonus}</p>
                                        <p><strong>Benefits:</strong> {salary.breakdown.benefits.join(', ')}</p>
                                    </div>
                                </div>
                            </InfoCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Comparison Modal Component ---
const ComparisonModal: React.FC<{ candidates: HistoricalInterviewRecord[], onClose: () => void }> = ({ candidates, onClose }) => {
    const fields: { label: string, key: keyof FinalReport['feedback'] | 'salary_range' }[] = [
        { label: 'Overall Score', key: 'overall_score' },
        { label: 'Star Rating', key: 'star_rating' },
        { label: 'Recommendation', key: 'final_recommendation' },
        { label: 'Experience Level', key: 'inferred_experience_level' },
        { label: 'Suggested Salary', key: 'salary_range' },
        { label: 'Strengths', key: 'strengths' },
        { label: 'Weaknesses', key: 'weaknesses' }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Candidate Comparison</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="overflow-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold text-slate-300 w-1/5">Metric</th>
                                {candidates.map(c => (
                                    <th key={c.id} className="p-3 font-semibold text-slate-300">{c.candidateName || c.resumeFileName}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {fields.map(field => (
                                <tr key={field.key}>
                                    <td className="p-3 font-medium text-slate-400">{field.label}</td>
                                    {candidates.map(c => {
                                        const value = field.key === 'salary_range' ? c.report.salary.salary_range : c.report.feedback[field.key as keyof FinalReport['feedback']];
                                        return (
                                            <td key={c.id} className="p-3 align-top text-sm">
                                                {field.key === 'star_rating' ? <StarRating rating={value as number} size="sm" />
                                                 : Array.isArray(value) ? 
                                                    <div className="flex flex-wrap gap-1">{value.map((v, i) => <span key={i} className="bg-slate-700 px-2 py-0.5 rounded text-xs">{v}</span>)}</div>
                                                 : String(value)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Communication Modal Component ---
const CommunicationModal: React.FC<{ candidate: HistoricalInterviewRecord, onClose: () => void }> = ({ candidate, onClose }) => {
    const [emailType, setEmailType] = useState<'NEXT_STEPS' | 'REJECTION' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState<{ subject: string, body: string } | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleGenerateEmail = async (type: 'NEXT_STEPS' | 'REJECTION') => {
        setIsLoading(true);
        setEmailType(type);
        setCopySuccess(false);
        setGeneratedEmail(null);
        try {
            const candidateDisplayName = candidate.candidateName || candidate.resumeFileName.replace(/\.\w+$/, '');
            const email = await aiRecruiterService.generateCommunicationEmail(candidate.report, candidateDisplayName, type);
            setGeneratedEmail(email);
        } catch (error) {
            console.error("Failed to generate email", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedEmail) return;
        const emailContent = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
        navigator.clipboard.writeText(emailContent).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        });
    };

    const mailtoLink = useMemo(() => {
        if (!generatedEmail || !candidate.candidateEmail) return undefined;
        return `mailto:${candidate.candidateEmail}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`;
    }, [generatedEmail, candidate.candidateEmail]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Communicate with Candidate</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <p><strong>Candidate:</strong> {candidate.candidateName || candidate.resumeFileName}</p>
                        {candidate.candidateEmail && <p className="text-sm text-slate-400"><strong>Email:</strong> {candidate.candidateEmail}</p>}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => handleGenerateEmail('NEXT_STEPS')} className="flex-1 bg-green-600 hover:bg-green-500 rounded-md px-4 py-2 font-semibold transition-colors">Generate 'Next Steps' Email</button>
                        <button onClick={() => handleGenerateEmail('REJECTION')} className="flex-1 bg-red-600 hover:bg-red-500 rounded-md px-4 py-2 font-semibold transition-colors">Generate 'Rejection' Email</button>
                    </div>
                    {isLoading && <div className="flex justify-center p-4"><Spinner /></div>}
                    {generatedEmail && (
                        <div className="space-y-2 animate-fade-in">
                            <input type="text" value={generatedEmail.subject} readOnly className="w-full bg-slate-700 p-2 rounded-md border border-slate-600" />
                            <textarea value={generatedEmail.body} readOnly rows={10} className="w-full bg-slate-700 p-2 rounded-md border border-slate-600 custom-scrollbar" />
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button onClick={handleCopy} className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700/60 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">
                                    <ClipboardDocumentListIcon className="w-4 h-4" />
                                    {copySuccess ? 'Copied!' : 'Copy'}
                                </button>
                                {mailtoLink ? (
                                    <a href={mailtoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                                        <EnvelopeIcon className="w-4 h-4" />
                                        Send via Email Client
                                    </a>
                                ) : (
                                    <button disabled title="Candidate email not available" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-800 rounded-lg cursor-not-allowed">
                                        <EnvelopeIcon className="w-4 h-4" />
                                        Send via Email Client
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Analytics View Component ---
const AnalyticsView: React.FC<{ records: HistoricalInterviewRecord[] }> = ({ records }) => {
    return (
        <div className="p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Interview Analytics</h2>
            <div className="text-center text-slate-400 p-16 bg-slate-900/50 rounded-lg border border-slate-700">
                <p>Analytics dashboard coming soon.</p>
                <p className="text-sm mt-2">Currently, you have {records.length} candidate records.</p>
            </div>
        </div>
    );
};

// --- Template Management Components (NEW) ---
const BLANK_TEMPLATE: Omit<InterviewTemplate, 'id'> = {
    name: '',
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    totalQuestions: 11,
    technicalRatio: 50,
    customQuestions: ''
};

interface TemplateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: InterviewTemplate | Omit<InterviewTemplate, 'id'>) => void;
    initialData?: InterviewTemplate | null;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(initialData || BLANK_TEMPLATE);

    useEffect(() => {
        setFormData(initialData || BLANK_TEMPLATE);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'totalQuestions' || name === 'technicalRatio' ? parseInt(value, 10) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{initialData ? 'Edit Template' : 'Create New Template'}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-4">
                     {Object.entries({name: "Template Name", companyName: "Company Name", jobTitle: "Job Title"}).map(([key, label]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                            <input type="text" name={key} value={(formData as any)[key]} onChange={handleChange} required className="w-full bg-slate-700 p-2 rounded-md border border-slate-600 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                        <textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows={6} required className="w-full bg-slate-700 p-2 rounded-md border border-slate-600 custom-scrollbar focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Total Questions (5-15)</label>
                      <input type="number" name="totalQuestions" min="5" max="15" value={formData.totalQuestions} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Technical Ratio ({formData.technicalRatio}%)</label>
                      <input type="range" name="technicalRatio" min="0" max="100" step="10" value={formData.technicalRatio} onChange={handleChange} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Must-Ask Questions (one per line)</label>
                      <textarea name="customQuestions" value={formData.customQuestions} onChange={handleChange} rows={3} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md custom-scrollbar focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold transition-colors">Save Template</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface TemplatesManagerProps {
    templates: InterviewTemplate[];
    onAddTemplate: (template: Omit<InterviewTemplate, 'id'>) => void;
    onUpdateTemplate: (template: InterviewTemplate) => void;
    onDeleteTemplate: (templateId: string) => void;
}

const TemplatesManager: React.FC<TemplatesManagerProps> = ({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | null>(null);

    const handleOpenCreate = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEdit = (template: InterviewTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleSave = (templateData: InterviewTemplate | Omit<InterviewTemplate, 'id'>) => {
        if ('id' in templateData) {
            onUpdateTemplate(templateData);
        } else {
            onAddTemplate(templateData);
        }
    };
    
    return (
        <div className="p-8 animate-fade-in">
            <TemplateFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingTemplate}
            />
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-100">Interview Templates</h2>
                 <button onClick={handleOpenCreate} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-500 transition-colors">Create New Template</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-5 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-slate-100">{template.name}</h3>
                            <p className="text-sm text-blue-300">{template.jobTitle}</p>
                            <p className="text-xs text-slate-400 mt-1">{template.companyName}</p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => handleOpenEdit(template)} className="px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-md">Edit</button>
                            <button onClick={() => onDeleteTemplate(template.id)} className="px-3 py-1 text-xs font-medium bg-red-800/70 hover:bg-red-700/80 text-red-200 rounded-md">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {templates.length === 0 && (
                 <div className="text-center text-slate-500 p-16 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p>No templates created yet.</p>
                    <p className="text-sm mt-2">Click 'Create New Template' to get started.</p>
                </div>
            )}
        </div>
    );
};


// --- Editable Note Cell Component ---
const EditableNoteCell: React.FC<{ 
    record: HistoricalInterviewRecord; 
    onUpdate: (id: string, fields: Partial<HistoricalInterviewRecord>) => void;
}> = ({ record, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [note, setNote] = useState(record.notes || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing) {
            textareaRef.current?.focus();
            textareaRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (note !== (record.notes || '')) {
            onUpdate(record.id, { notes: note });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setNote(record.notes || '');
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-700 p-1 rounded border border-blue-500 text-sm h-20 resize-none custom-scrollbar"
                aria-label={`Note for ${record.candidateName || record.resumeFileName}`}
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="min-h-[2.5rem] cursor-pointer hover:bg-slate-700/50 p-1 rounded whitespace-pre-wrap text-slate-400"
            title="Click to edit note"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
        >
            {note || <span className="text-slate-500 italic">Add note...</span>}
        </div>
    );
};


// --- Candidate List View Component ---
const CandidateListView: React.FC<{
  records: HistoricalInterviewRecord[];
  onUpdateRecord: (id: string, fields: Partial<HistoricalInterviewRecord>) => void;
  searchTerm: string;
}> = ({ records, onUpdateRecord, searchTerm }) => {
  const [filter, setFilter] = useState<CandidateStatus | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [communicationCandidate, setCommunicationCandidate] = useState<HistoricalInterviewRecord | null>(null);
  const [comparisonCandidates, setComparisonCandidates] = useState<HistoricalInterviewRecord[]>([]);
  const [viewingProfile, setViewingProfile] = useState<HistoricalInterviewRecord | null>(null);
  const [viewingRecording, setViewingRecording] = useState<HistoricalInterviewRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => filter === 'ALL' || r.status === filter)
      .filter(r => {
        const lowerSearch = searchTerm.toLowerCase();
        if (!lowerSearch) return true;
        return (
          (r.candidateName && r.candidateName.toLowerCase().includes(lowerSearch)) ||
          r.resumeFileName.toLowerCase().includes(lowerSearch) ||
          r.jobTitle.toLowerCase().includes(lowerSearch) ||
          r.status.toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, filter, searchTerm]);
  
  const handleSelect = (id: string) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(new Set(filteredRecords.map(r => r.id)));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleCompare = () => {
      const toCompare = records.filter(r => selectedIds.has(r.id));
      if (toCompare.length > 1) {
          setComparisonCandidates(toCompare);
      }
  };

  const handleDownloadResume = (record: HistoricalInterviewRecord) => {
    if (!record.resumeText) {
        alert('Resume content is not available for this record.');
        return;
    }

    const blob = new Blob([record.resumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', record.resumeFileName || 'resume.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const isAllSelected = selectedIds.size > 0 && selectedIds.size === filteredRecords.length;

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {comparisonCandidates.length > 0 && <ComparisonModal candidates={comparisonCandidates} onClose={() => setComparisonCandidates([])} />}
      {communicationCandidate && <CommunicationModal candidate={communicationCandidate} onClose={() => setCommunicationCandidate(null)} />}
      {viewingProfile && <CandidateProfileModal record={viewingProfile} onClose={() => setViewingProfile(null)} />}
      {viewingRecording && <VideoPlaybackModal record={viewingRecording} onClose={() => setViewingRecording(null)} />}


      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', ...Object.values(CandidateStatus)] as const).map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === status ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
            >
              {status}
            </button>
          ))}
        </div>
        <button 
          onClick={handleCompare}
          disabled={selectedIds.size < 2}
          className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg text-sm disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
        >
          Compare ({selectedIds.size})
        </button>
      </div>
      
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1024px]">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th scope="col" className="p-3 w-10"><input type="checkbox" className="bg-slate-700 border-slate-600 rounded focus:ring-blue-500" onChange={handleSelectAll} checked={isAllSelected} aria-label="Select all candidates" /></th>
                <th scope="col" className="p-3 font-semibold">Date</th>
                <th scope="col" className="p-3 font-semibold">Candidate</th>
                <th scope="col" className="p-3 font-semibold">Role</th>
                <th scope="col" className="p-3 font-semibold">Performance</th>
                <th scope="col" className="p-3 font-semibold">Status</th>
                <th scope="col" className="p-3 font-semibold w-1/4">Notes</th>
                <th scope="col" className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3"><input type="checkbox" className="bg-slate-700 border-slate-600 rounded focus:ring-blue-500" checked={selectedIds.has(record.id)} onChange={() => handleSelect(record.id)} aria-label={`Select ${record.candidateName || record.resumeFileName}`} /></td>
                  <td className="p-3 text-slate-400">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="p-3">
                      <div className="font-medium">{record.candidateName || record.resumeFileName}</div>
                      {record.candidateName && <div className="text-xs text-slate-400">{record.resumeFileName}</div>}
                  </td>
                  <td className="p-3 text-slate-400">{record.jobTitle}</td>
                  <td className="p-3">
                      <div className="flex items-center gap-3">
                        <ScoreVisual score={record.report.feedback.overall_score} />
                        <StarRating rating={record.report.feedback.star_rating} size="sm" />
                      </div>
                  </td>
                  <td className="p-3">
                      <select 
                          value={record.status} 
                          onChange={(e) => onUpdateRecord(record.id, { status: e.target.value as CandidateStatus })}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
                          aria-label={`Status for ${record.candidateName || record.resumeFileName}`}
                      >
                         {Object.values(CandidateStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </td>
                  <td className="p-3 align-top">
                      <EditableNoteCell record={record} onUpdate={onUpdateRecord} />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => setViewingProfile(record)} title="View Full Report" className="p-2 hover:bg-slate-700 rounded-full transition-colors"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                    {record.videoRecordingUrl && (
                        <button onClick={() => setViewingRecording(record)} title="View Recording" className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white">
                            <VideoCameraIcon className="w-5 h-5"/>
                        </button>
                    )}
                    <button onClick={() => handleDownloadResume(record)} title="Download Resume" className="p-2 hover:bg-slate-700 rounded-full transition-colors"><DocumentArrowDownIcon className="w-5 h-5"/></button>
                    <button onClick={() => setCommunicationCandidate(record)} title="Send Email" className="p-2 hover:bg-slate-700 rounded-full transition-colors"><EnvelopeIcon className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRecords.length === 0 && (
            <div className="text-center py-16 text-slate-500">
                <p>No candidates found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main HrDashboard Component ---
interface HrDashboardProps {
  records: HistoricalInterviewRecord[];
  templates: InterviewTemplate[];
  onAddTemplate: (template: Omit<InterviewTemplate, 'id'>) => void;
  onUpdateTemplate: (template: InterviewTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onLogout: () => void;
  onUpdateRecord: (id: string, fields: Partial<HistoricalInterviewRecord>) => void;
  currentUser: User | null;
}

const HrDashboard: React.FC<HrDashboardProps> = ({ 
    records, 
    templates, 
    onAddTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    onLogout, 
    onUpdateRecord, 
    currentUser 
}) => {
    const [activeTab, setActiveTab] = useState<HrTab>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const TabButton: React.FC<{ tab: HrTab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            aria-current={activeTab === tab ? 'page' : undefined}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen w-full bg-[#0f172a] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="py-6 flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-3xl font-bold">HR Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input
                                type="text"
                                placeholder="Search by name, role, or status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 w-64 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                aria-label="Search candidates"
                            />
                        </div>
                         <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                            <UserCircleIcon className="w-6 h-6 text-slate-400"/>
                            <span className="text-sm font-medium">{currentUser?.name || 'HR Professional'}</span>
                        </div>
                        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
                            <ArrowRightOnRectangleIcon className="w-4 h-4"/>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="border-b border-slate-700 mb-6 relative">
                    <nav className="flex items-center space-x-2" role="tablist">
                        <TabButton tab="list" label="Candidate List" />
                        <TabButton tab="analytics" label="Analytics" />
                        <TabButton tab="templates" label="Templates" />
                    </nav>
                     <div 
                        className="absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300"
                        style={{
                            width: activeTab === 'list' ? '105px' : activeTab === 'analytics' ? '70px' : '75px',
                            transform: activeTab === 'list' ? 'translateX(0)' : activeTab === 'analytics' ? 'translateX(121px)' : 'translateX(207px)'
                        }}
                    />
                </div>

                {/* Content */}
                <main>
                    {activeTab === 'list' && <CandidateListView records={records} onUpdateRecord={onUpdateRecord} searchTerm={searchTerm} />}
                    {activeTab === 'analytics' && <AnalyticsView records={records} />}
                    {activeTab === 'templates' && <TemplatesManager 
                                                    templates={templates} 
                                                    onAddTemplate={onAddTemplate}
                                                    onUpdateTemplate={onUpdateTemplate}
                                                    onDeleteTemplate={onDeleteTemplate}
                                                  />}
                </main>
            </div>
        </div>
    );
};

export default HrDashboard;