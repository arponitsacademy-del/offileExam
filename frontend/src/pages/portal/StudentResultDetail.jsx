import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { Award, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function StudentResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/student-portal/results/${id}`);
        if (res.data.success) {
          setResult(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching result details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading performance breakdown...</div>;
  }

  if (!result) {
    return <div className="p-12 text-center text-xs text-rose-500 font-bold">Result not found or not published.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/student-portal')}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Detailed Question Evaluation Breakdown
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exam: <strong>{result.exam?.title}</strong> ({result.exam?.subject?.name})
          </p>
        </div>
      </div>

      {/* Score Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Score</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{result.final_score}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Percentage</p>
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-0.5">{result.percentage}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Merit Rank</p>
          <p className="text-2xl font-black text-amber-600 mt-0.5">{result.rank ? `#${result.rank}` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
          <span className={`inline-block mt-1 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
            result.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
          }`}>
            {result.is_passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>
      </div>

      {/* Answer Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Per-Question Response Key
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3">Q.No</th>
                <th className="px-5 py-3">Your Answer</th>
                <th className="px-5 py-3">Correct Answer</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3 text-right">Marks Awarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {result.answers?.map((ans) => (
                <tr key={ans.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-mono font-bold">{ans.question_number}</td>
                  <td className="px-5 py-3 font-bold">
                    {ans.student_answer ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {ans.student_answer}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Skipped</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-bold text-slate-600 dark:text-slate-300">
                    {ans.correct_answer}
                  </td>
                  <td className="px-5 py-3">
                    {ans.is_correct ? (
                      <span className="text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </span>
                    ) : ans.is_blank ? (
                      <span className="text-slate-400">Blank</span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Wrong</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold">
                    {ans.score_awarded > 0 ? `+${ans.score_awarded}` : ans.score_awarded}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

