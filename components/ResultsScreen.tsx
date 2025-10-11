import React from 'react';
import { FinalReport } from '../types';
import StarRating from './StarRating';
import { ArrowPathIcon } from './icons';

interface ResultsScreenProps {
  report: FinalReport | null;
  onRestart: () => void;
  isLoading: boolean;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">{title}</h3>
        <div className="text-slate-300">{children}</div>
    </div>
);

const Pill: React.FC<{ text: string; color: 'green' | 'red' }> = ({ text, color }) => {
    const colorClasses = color === 'green' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300';
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses}`}>{text}</span>
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ report, onRestart, isLoading }) => {
  if (isLoading || !report) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white">
            <div className="animate-pulse text-center">
                 <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h2 className="text-2xl font-bold mt-6">Generating Your Report...</h2>
                <p className="text-slate-400 mt-2">The AI is analyzing the interview to provide detailed feedback.</p>
            </div>
        </div>
    );
  }

  const { feedback, salary } = report;

  const recommendationColor = feedback.final_recommendation.toLowerCase().includes('hire') ? 'text-green-400'
    : feedback.final_recommendation.toLowerCase().includes('reservations') ? 'text-yellow-400'
    : feedback.final_recommendation.toLowerCase().includes('future') ? 'text-blue-300'
    : 'text-slate-300';

  return (
    <div className="min-h-screen w-full p-4 md:p-8 text-white animate-fade-in">
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-slate-100">Interview Report</h1>
                 <button onClick={onRestart} className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                   <ArrowPathIcon className="w-4 h-4"/>
                    Start New Interview
                </button>
            </div>
            
            {/* Overall Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in-up">
                <div className="md:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl flex flex-col justify-center items-center text-center shadow-2xl">
                    <h2 className="text-2xl font-bold mb-2">Overall Score</h2>
                    <p className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">{feedback.overall_score}</p>
                    <StarRating rating={feedback.star_rating} size="lg" />
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-xl flex flex-col justify-center text-center shadow-lg">
                    <h2 className="text-lg font-semibold text-slate-300 mb-2">Final Recommendation</h2>
                    <p className={`text-2xl font-bold ${recommendationColor}`}>{feedback.final_recommendation}</p>
                     <p className="text-sm text-slate-400 mt-2">Experience: {feedback.inferred_experience_level}</p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up" style={{animationDelay: '0.2s'}}>
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                             <div>
                                <p className="text-3xl font-bold text-green-400">{salary.salary_range}</p>
                                <p className="text-slate-400 text-sm mt-1">{salary.justification}</p>
                            </div>
                            <div className="mt-4 md:mt-0 text-left md:text-right">
                                <p><strong>Base:</strong> {salary.breakdown.base_salary}</p>
                                <p><strong>Bonus:</strong> {salary.breakdown.bonus}</p>
                                <p><strong>Benefits:</strong> {salary.breakdown.benefits.join(', ')}</p>
                            </div>
                        </div>
                    </InfoCard>
                </div>
                 <div className="lg:col-span-2">
                     <InfoCard title="Improvement Tips for Candidate">
                        <ul className="list-disc list-inside space-y-2">
                           {feedback.improvement_tips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                    </InfoCard>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResultsScreen;