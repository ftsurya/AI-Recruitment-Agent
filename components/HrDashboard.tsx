import React, { useState } from 'react';
import { HistoricalInterviewRecord, CandidateStatus, FinalReport } from '../types';
import StarRating from './StarRating';

const StatusBadge: React.FC<{ status: CandidateStatus }> = ({ status }) => {
    const colorClasses = {
        [CandidateStatus.PENDING]: 'bg-yellow-500/20 text-yellow-300',
        [CandidateStatus.REVIEWING]: 'bg-blue-500/20 text-blue-300',
        [CandidateStatus.SHORTLISTED]: 'bg-green-500/20 text-green-300',
        [CandidateStatus.REJECTED]: 'bg-red-500/20 text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[status]}`}>{status}</span>;
};

const ReportModal: React.FC<{ report: FinalReport, onClose: () => void }> = ({ report, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">Interview Report</h2>
                <div className="space-y-4 text-sm">
                    <div><strong>Overall Score:</strong> {report.feedback.overall_score}/100</div>
                    <div><strong>Rating:</strong> <StarRating rating={report.feedback.star_rating} /></div>
                    <div><strong>Recommendation:</strong> {report.feedback.final_recommendation}</div>
                    <div><strong>Strengths:</strong> {report.feedback.strengths.join(', ')}</div>
                    <div><strong>Weaknesses:</strong> {report.feedback.weaknesses.join(', ')}</div>
                    <div><strong>Salary Suggestion:</strong> {report.salary.salary_range}</div>
                </div>
                <button onClick={onClose} className="mt-6 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors w-full">Close</button>
            </div>
        </div>
    );
};


interface HrDashboardProps {
  records: HistoricalInterviewRecord[];
  onBack: () => void;
  onUpdateRecord: (id: string, newStatus: CandidateStatus, newNotes: string) => void;
}

const HrDashboard: React.FC<HrDashboardProps> = ({ records, onBack, onUpdateRecord }) => {
    const [filter, setFilter] = useState<CandidateStatus | 'ALL'>('ALL');
    const [selectedRecord, setSelectedRecord] = useState<HistoricalInterviewRecord | null>(null);

    const filteredRecords = records.filter(r => filter === 'ALL' || r.status === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <div className="min-h-screen w-full p-4 md:p-8 text-white animate-fade-in bg-[#0f172a]">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">HR Dashboard</h1>
                    <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-blue-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        &larr; Back to Setup
                    </button>
                </div>

                {/* Filters */}
                <div className="flex space-x-2 mb-6">
                    {(['ALL', ...Object.values(CandidateStatus)]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as CandidateStatus | 'ALL')}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === status ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Candidate List */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-800 text-xs text-slate-400 uppercase">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Candidate (Resume)</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Score</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length > 0 ? filteredRecords.map(record => (
                                    <tr key={record.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                        <td className="p-4 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium">{record.resumeFileName}</td>
                                        <td className="p-4 font-medium">{record.jobTitle}</td>
                                        <td className="p-4">{record.report.feedback.overall_score} <span className="text-slate-400">/ 100</span></td>
                                        <td className="p-4"><StatusBadge status={record.status} /></td>
                                        <td className="p-4">
                                            <button onClick={() => setSelectedRecord(record)} className="text-blue-400 hover:underline text-sm">View Report</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-slate-400">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {selectedRecord && <ReportModal report={selectedRecord.report} onClose={() => setSelectedRecord(null)} />}
        </div>
    );
};

export default HrDashboard;