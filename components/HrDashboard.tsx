import React, { useState, useMemo, Dispatch, SetStateAction, useRef, useEffect } from 'react';
import { HistoricalInterviewRecord, CandidateStatus, FinalReport, InterviewTemplate, User, TranscriptEntry } from '../types';
import StarRating from './StarRating';
import Spinner from './Spinner';
import { XIcon, EnvelopeIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, UserCircleIcon, DocumentArrowDownIcon, VideoCameraIcon, GaugeIcon, ShieldCheckIcon, XCircleIcon } from './icons';
import { aiRecruiterService } from '../services/geminiService';

// --- Sub-components defined in the same file as per instructions ---

type HrTab = 'list' | 'analytics' | 'templates';

// --- Reusable UI Elements for Modals ---
const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 backdrop-blur-lg border border-white/10 p-4 rounded-xl">
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
            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
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
                    <div className="w-full md:w-1/3 flex flex-col bg-black/20 backdrop-blur-xl rounded-lg border border-white/10">
                        <h3 className="text-lg font-semibold p-3 border-b border-white/10 flex-shrink-0">Transcript</h3>
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
            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Candidate Profile: {record.candidateName || record.resumeFileName}</h2>
                        <p className="text-sm text-slate-400">{record.jobTitle}</p>
                    </div>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="overflow-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-2 bg-black/20 backdrop-blur-lg border border-white/10 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                            <h2 className="text-xl font-bold mb-2">Overall Score</h2>
                            <p className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-3">{feedback.overall_score}</p>
                            <StarRating rating={feedback.star_rating} size="md" />
                        </div>
                        <div className="bg-black/20 backdrop-blur-lg border border-white/10 p-6 rounded-xl flex flex-col justify-center text-center">
                            <h2 className="text-md font-semibold text-slate-300 mb-2">Recommendation</h2>
                            <p className={`text-xl font-bold ${recommendationColor}`}>{feedback.final_recommendation}</p>
                            <p className="text-xs text-slate-400 mt-2">Experience: {feedback.inferred_experience_level}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {record.extractedSkills && record.extractedSkills.length > 0 && (
                            <div className="lg:col-span-2">
                                <InfoCard title="Key Skills from Resume">
                                    <div className="flex flex-wrap gap-2">
                                        {record.extractedSkills.map((skill, i) => (
                                            <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 text-xs rounded-md">{skill}</span>
                                        ))}
                                    </div>
                                </InfoCard>
                            </div>
                        )}
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
            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Candidate Comparison</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="overflow-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-black/30 backdrop-blur-md sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold text-slate-300 w-1/5">Metric</th>
                                {candidates.map(c => (
                                    <th key={c.id} className="p-3 font-semibold text-slate-300">{c.candidateName || c.resumeFileName}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {fields.map(field => (
                                <tr key={field.key}>
                                    <td className="p-3 font-medium text-slate-400">{field.label}</td>
                                    {candidates.map(c => {
                                        const value = field.key === 'salary_range' ? c.report.salary.salary_range : c.report.feedback[field.key as keyof FinalReport['feedback']];
                                        return (
                                            <td key={c.id} className="p-3 align-top text-sm">
                                                {field.key === 'star_rating' ? <StarRating rating={value as number} size="sm" />
                                                 : Array.isArray(value) ? 
                                                    <div className="flex flex-wrap gap-1">{value.map((v, i) => <span key={i} className="bg-white/10 px-2 py-0.5 rounded text-xs">{v}</span>)}</div>
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
            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-2xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Communicate with Candidate</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <p><strong>Candidate:</strong> {candidate.candidateName || candidate.resumeFileName}</p>
                        {candidate.candidateEmail && <p className="text-sm text-slate-400"><strong>Email:</strong> {candidate.candidateEmail}</p>}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => handleGenerateEmail('NEXT_STEPS')} className="flex-1 bg-green-600/50 border border-green-500 hover:bg-green-600/70 rounded-md px-4 py-2 font-semibold transition-colors">Generate 'Next Steps' Email</button>
                        <button onClick={() => handleGenerateEmail('REJECTION')} className="flex-1 bg-red-600/50 border border-red-500 hover:bg-red-600/70 rounded-md px-4 py-2 font-semibold transition-colors">Generate 'Rejection' Email</button>
                    </div>
                    {isLoading && <div className="flex justify-center p-4"><Spinner /></div>}
                    {generatedEmail && (
                        <div className="space-y-2 animate-fade-in">
                            <input type="text" value={generatedEmail.subject} readOnly className="w-full bg-black/30 p-2 rounded-md border border-slate-600" />
                            <textarea value={generatedEmail.body} readOnly rows={10} className="w-full bg-black/30 p-2 rounded-md border border-slate-600 custom-scrollbar" />
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button onClick={handleCopy} className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                                    <ClipboardDocumentListIcon className="w-4 h-4" />
                                    {copySuccess ? 'Copied!' : 'Copy'}
                                </button>
                                {mailtoLink ? (
                                    <a href={mailtoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600/70 border border-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
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


// --- Analytics Sub-Components ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-center gap-4">
        <div className="bg-blue-500/20 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const ScoreDistributionChart: React.FC<{ scores: number[] }> = ({ scores }) => {
    const scoreBuckets = useMemo(() => {
        const buckets = Array(10).fill(0);
        scores.forEach(score => {
            const index = Math.min(Math.floor(score / 10.01), 9);
            buckets[index]++;
        });
        return buckets;
    }, [scores]);

    const maxCount = Math.max(...scoreBuckets, 1);

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Score Distribution</h3>
            <div className="flex justify-between items-end h-64 gap-2 pt-4">
                {scoreBuckets.map((count, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="text-xs font-bold text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                        <div
                            className="w-full bg-blue-600/50 hover:bg-blue-500 rounded-t-md transition-all"
                            style={{ height: `${(count / maxCount) * 100}%` }}
                            title={`${count} candidates`}
                        />
                        <div className="text-xs text-slate-400 mt-2 border-t border-slate-600 w-full text-center pt-1">{index * 10}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatusDistributionChart: React.FC<{ records: HistoricalInterviewRecord[] }> = ({ records }) => {
    const statusCounts = useMemo(() => {
        return records.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<CandidateStatus, number>);
    }, [records]);

    const total = records.length;
    
    const data = [
        { status: CandidateStatus.SHORTLISTED, count: statusCounts[CandidateStatus.SHORTLISTED] || 0, color: 'text-green-400', ringColor: 'stroke-green-400' },
        { status: CandidateStatus.PENDING, count: statusCounts[CandidateStatus.PENDING] || 0, color: 'text-yellow-400', ringColor: 'stroke-yellow-400' },
        { status: CandidateStatus.REVIEWING, count: statusCounts[CandidateStatus.REVIEWING] || 0, color: 'text-blue-400', ringColor: 'stroke-blue-400' },
        { status: CandidateStatus.REJECTED, count: statusCounts[CandidateStatus.REJECTED] || 0, color: 'text-red-400', ringColor: 'stroke-red-400' },
    ];

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Candidate Status Breakdown</h3>
            <div className="flex items-center gap-8">
                <div className="relative">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                         <circle className="stroke-slate-700" cx="80" cy="80" r={radius} strokeWidth="20" fill="transparent" />
                         {data.map(item => {
                             if (item.count === 0) return null;
                             const percentage = (item.count / total);
                             const dashoffset = circumference - (percentage * circumference); 
                             const rotation = (accumulatedOffset / circumference * 360);
                             accumulatedOffset += percentage * circumference;
                             
                             return (
                                 <circle
                                    key={item.status}
                                    className={item.ringColor}
                                    cx="80" cy="80" r={radius} strokeWidth="20" fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashoffset}
                                    strokeLinecap="round"
                                    transform={`rotate(${rotation} 80 80) rotate(-90 80 80)`}
                                />
                             );
                         })}
                    </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{total}</span>
                        <span className="text-sm text-slate-400">Total</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    {data.map(item => (
                        <div key={item.status} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`}></span>
                                <span className="text-slate-300">{item.status}</span>
                            </div>
                            <span className="font-semibold text-slate-200">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CommonKeywordsList: React.FC<{ records: HistoricalInterviewRecord[]; type: 'strengths' | 'weaknesses' }> = ({ records, type }) => {
    const keywords = useMemo(() => {
        const keywordMap = new Map<string, number>();
        records.forEach(r => {
            r.report.feedback[type].forEach(keyword => {
                keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
            });
        });
        return Array.from(keywordMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [records, type]);

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 capitalize">Top 5 Candidate {type}</h3>
            {keywords.length > 0 ? (
                <ul className="space-y-2">
                    {keywords.map(([keyword, count]) => (
                        <li key={keyword} className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">{keyword}</span>
                            <span className={`font-semibold px-2 py-0.5 rounded-md text-xs ${type === 'strengths' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{count} mentions</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-500 text-sm">Not enough data to determine common {type}.</p>
            )}
        </div>
    );
};


// --- Analytics View Component ---
const AnalyticsView: React.FC<{ records: HistoricalInterviewRecord[] }> = ({ records }) => {
    const analyticsData = useMemo(() => {
        if (records.length === 0) {
            return {
                totalInterviews: 0,
                avgScore: 0,
                shortlistedCount: 0,
                rejectionRate: 0,
                allScores: [],
            };
        }
        
        const totalInterviews = records.length;
        const avgScore = totalInterviews > 0 ? Math.round(records.reduce((sum, r) => sum + r.report.feedback.overall_score, 0) / totalInterviews) : 0;
        const shortlistedCount = records.filter(r => r.status === CandidateStatus.SHORTLISTED).length;
        const rejectedCount = records.filter(r => r.status === CandidateStatus.REJECTED).length;
        const rejectionRate = totalInterviews > 0 ? Math.round((rejectedCount / totalInterviews) * 100) : 0;
        const allScores = records.map(r => r.report.feedback.overall_score);

        return { totalInterviews, avgScore, shortlistedCount, rejectionRate, allScores };
    }, [records]);

    if (records.length === 0) {
        return (
            <div className="p-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Interview Analytics</h2>
                <div className="text-center text-slate-500 p-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
                    <p>No interview data available yet.</p>
                    <p className="text-sm mt-2">Complete some interviews to see analytics here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">Interview Analytics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Interviews" value={analyticsData.totalInterviews} icon={<UserCircleIcon className="w-6 h-6 text-blue-300" />} />
                <StatCard title="Average Score" value={analyticsData.avgScore} icon={<GaugeIcon className="w-6 h-6 text-blue-300" />} />
                <StatCard title="Shortlisted" value={analyticsData.shortlistedCount} icon={<ShieldCheckIcon className="w-6 h-6 text-blue-300" />} />
                <StatCard title="Rejection Rate" value={`${analyticsData.rejectionRate}%`} icon={<XCircleIcon className="w-6 h-6 text-blue-300" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScoreDistributionChart scores={analyticsData.allScores} />
                <StatusDistributionChart records={records} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CommonKeywordsList records={records} type="strengths" />
                <CommonKeywordsList records={records} type="weaknesses" />
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{initialData ? 'Edit Template' : 'Create New Template'}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-4">
                     {Object.entries({name: "Template Name", companyName: "Company Name", jobTitle: "Job Title"}).map(([key, label]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                            <input type="text" name={key} value={(formData as any)[key]} onChange={handleChange} required className="w-full bg-black/30 p-2 rounded-md border border-slate-600 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                        <textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows={6} required className="w-full bg-black/30 p-2 rounded-md border border-slate-600 custom-scrollbar focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-md font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600/70 border border-blue-500 hover:bg-blue-600 rounded-md font-semibold transition-colors">Save Template</button>
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
        <div className="p-4 md:p-8 animate-fade-in">
            <TemplateFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingTemplate}
            />
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-100">Interview Templates</h2>
                 <button onClick={handleOpenCreate} className="px-4 py-2 bg-blue-600/70 border border-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition-colors">Create New Template</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-5 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-slate-100">{template.name}</h3>
                            <p className="text-sm text-blue-300">{template.jobTitle}</p>
                            <p className="text-xs text-slate-400 mt-1">{template.companyName}</p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => handleOpenEdit(template)} className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md">Edit</button>
                            <button onClick={() => onDeleteTemplate(template.id)} className="px-3 py-1 text-xs font-medium bg-red-800/70 hover:bg-red-700/80 text-red-200 rounded-md">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {templates.length === 0 && (
                 <div className="text-center text-slate-500 p-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
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
                className="w-full h-24 p-2 bg-slate-900/70 backdrop-blur-sm border border-blue-500 rounded-md focus:outline-none resize-none text-sm"
                aria-label="Edit notes"
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="w-full min-h-[4rem] text-sm text-slate-400 hover:bg-white/5 p-2 rounded-md cursor-pointer transition-colors"
            title="Click to edit note"
        >
            {note || <span className="text-slate-500">Click to add a note...</span>}
        </div>
    );
};

// --- Candidate Row Component ---
const CandidateRow: React.FC<{
    record: HistoricalInterviewRecord;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onViewProfile: (record: HistoricalInterviewRecord) => void;
    onCommunicate: (record: HistoricalInterviewRecord) => void;
    onViewVideo: (record: HistoricalInterviewRecord) => void;
    onUpdate: (id: string, fields: Partial<HistoricalInterviewRecord>) => void;
}> = ({ record, isSelected, onSelect, onViewProfile, onCommunicate, onViewVideo, onUpdate }) => {
    const statusClasses: Record<CandidateStatus, string> = {
        [CandidateStatus.PENDING]: 'bg-yellow-500/20 text-yellow-300',
        [CandidateStatus.REVIEWING]: 'bg-blue-500/20 text-blue-300',
        [CandidateStatus.SHORTLISTED]: 'bg-green-500/20 text-green-300',
        [CandidateStatus.REJECTED]: 'bg-red-500/20 text-red-300'
    };

    return (
        <tr className={`border-b border-white/10 transition-colors ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <td className="p-3 text-center">
                <input type="checkbox" checked={isSelected} onChange={() => onSelect(record.id)} className="w-4 h-4 bg-transparent border-slate-600 text-blue-500 focus:ring-blue-500" />
            </td>
            <td className="p-3">
                <div className="font-semibold text-slate-200">{record.candidateName || record.resumeFileName}</div>
                <div className="text-xs text-slate-400">{record.candidateEmail || 'No email provided'}</div>
            </td>
            <td className="p-3 text-sm text-slate-300">{record.jobTitle}</td>
            <td className="p-3 text-center"><ScoreVisual score={record.report.feedback.overall_score} /></td>
            <td className="p-3">
                <select 
                    value={record.status} 
                    onChange={(e) => onUpdate(record.id, { status: e.target.value as CandidateStatus })}
                    className={`px-2 py-1 text-xs font-medium rounded-md border-0 focus:ring-2 focus:ring-blue-500 ${statusClasses[record.status]} bg-transparent`}
                >
                    {Object.values(CandidateStatus).map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
                </select>
            </td>
            <td className="p-3"><EditableNoteCell record={record} onUpdate={onUpdate} /></td>
            <td className="p-3 text-right">
                <div className="flex justify-end items-center gap-1">
                    {record.videoRecordingUrl && (
                        <button onClick={() => onViewVideo(record)} title="View Interview Recording" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                            <VideoCameraIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => onViewProfile(record)} title="View Full Report" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onCommunicate(record)} title="Communicate with Candidate" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                        <EnvelopeIcon className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// --- Candidate List View Component ---
const CandidateListView: React.FC<{
    records: HistoricalInterviewRecord[];
    onUpdateRecord: (id: string, fields: Partial<HistoricalInterviewRecord>) => void;
}> = ({ records, onUpdateRecord }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewingProfile, setViewingProfile] = useState<HistoricalInterviewRecord | null>(null);
    const [viewingComparison, setViewingComparison] = useState<HistoricalInterviewRecord[]>([]);
    const [viewingCommunication, setViewingCommunication] = useState<HistoricalInterviewRecord | null>(null);
    const [viewingVideo, setViewingVideo] = useState<HistoricalInterviewRecord | null>(null);

    const filteredRecords = useMemo(() => {
        return records.filter(r =>
            (r.candidateName || r.resumeFileName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.status.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records, searchTerm]);

    const handleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };
    
    const handleCompare = () => {
        const toCompare = records.filter(r => selectedIds.includes(r.id));
        if (toCompare.length > 1) {
            setViewingComparison(toCompare);
        }
    };

    const handleDownload = () => {
        const toDownload = records.filter(r => selectedIds.includes(r.id));
        if (toDownload.length === 0) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toDownload, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `candidate_reports_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in">
             {viewingProfile && <CandidateProfileModal record={viewingProfile} onClose={() => setViewingProfile(null)} />}
            {viewingComparison.length > 0 && <ComparisonModal candidates={viewingComparison} onClose={() => setViewingComparison([])} />}
            {viewingCommunication && <CommunicationModal candidate={viewingCommunication} onClose={() => setViewingCommunication(null)} />}
            {viewingVideo && <VideoPlaybackModal record={viewingVideo} onClose={() => setViewingVideo(null)} />}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-100">Candidate Records</h2>
                <div className="relative w-full sm:w-auto">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
                <button onClick={handleCompare} disabled={selectedIds.length < 2} className="px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Compare ({selectedIds.length})
                </button>
                 <button onClick={handleDownload} disabled={selectedIds.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export ({selectedIds.length})
                </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/20 backdrop-blur-md">
                            <tr>
                                <th className="p-3 text-center w-12">
                                    <input type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length}
                                        onChange={() => setSelectedIds(selectedIds.length === filteredRecords.length ? [] : filteredRecords.map(r => r.id))}
                                        className="w-4 h-4 bg-transparent border-slate-600 text-blue-500 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="p-3 font-semibold text-slate-300 min-w-[200px]">Candidate</th>
                                <th className="p-3 font-semibold text-slate-300 min-w-[150px]">Job Title</th>
                                <th className="p-3 font-semibold text-slate-300 text-center">Score</th>
                                <th className="p-3 font-semibold text-slate-300 min-w-[150px]">Status</th>
                                <th className="p-3 font-semibold text-slate-300 min-w-[200px]">Notes</th>
                                <th className="p-3 font-semibold text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(record => (
                                <CandidateRow
                                    key={record.id}
                                    record={record}
                                    isSelected={selectedIds.includes(record.id)}
                                    onSelect={handleSelect}
                                    onViewProfile={setViewingProfile}
                                    onCommunicate={setViewingCommunication}
                                    onViewVideo={setViewingVideo}
                                    onUpdate={onUpdateRecord}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredRecords.length === 0 && (
                    <div className="text-center text-slate-500 p-16">
                        <p>No records found.</p>
                        {searchTerm && <p className="text-sm mt-2">Try adjusting your search query.</p>}
                    </div>
                 )}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
export const HrDashboard: React.FC<{
    records: HistoricalInterviewRecord[];
    templates: InterviewTemplate[];
    onAddTemplate: (template: Omit<InterviewTemplate, 'id'>) => void;
    onUpdateTemplate: (template: InterviewTemplate) => void;
    onDeleteTemplate: (templateId: string) => void;
    onLogout: () => void;
    onUpdateRecord: (id: string, fields: Partial<HistoricalInterviewRecord>) => void;
    currentUser: User | null;
}> = ({ records, templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate, onLogout, onUpdateRecord, currentUser }) => {
    const [activeTab, setActiveTab] = useState<HrTab>('list');

    const TabButton: React.FC<{ tab: HrTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold rounded-md text-sm transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen w-full flex text-white bg-transparent">
            <aside className="w-64 bg-black/30 backdrop-blur-2xl border-r border-white/10 flex flex-col p-4">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <UserCircleIcon className="w-8 h-8 text-blue-400" />
                    <div>
                        <h1 className="font-bold text-lg text-slate-100">{currentUser?.name || 'HR Dashboard'}</h1>
                        <p className="text-xs text-slate-400">NexusAI Corp</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-2">
                    <TabButton tab="list" label="Candidate List" />
                    <TabButton tab="analytics" label="Analytics" />
                    <TabButton tab="templates" label="Templates" />
                </nav>
                <div className="mt-auto">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-auto">
                {activeTab === 'list' && <CandidateListView records={records} onUpdateRecord={onUpdateRecord} />}
                {activeTab === 'analytics' && <AnalyticsView records={records} />}
                {activeTab === 'templates' && <TemplatesManager templates={templates} onAddTemplate={onAddTemplate} onUpdateTemplate={onUpdateTemplate} onDeleteTemplate={onDeleteTemplate} />}
            </main>
        </div>
    );
};