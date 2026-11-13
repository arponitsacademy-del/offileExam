import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Award, CheckCircle2, TrendingUp, Calendar, ArrowRight, BookOpen } from 'lucide-react';

export default function StudentPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublishedResults = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/student-portal/results');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Student portal fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublishedResults();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading student results...</div>;
  }

  const student = data?.student;
  const results = data?.results || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">Student Portal</span>
          <h1 className="text-2xl font-black mt-1">
            Welcome, {student?.full_name || 'Student Candidate'}
          </h1>
          <p className="text-xs text-emerald-100 mt-0.5 font-mono">
            Roll #{student?.roll_no} • UID: {student?.student_uid}
          </p>
        </div>

        <div className="flex items-center space-x-6 text-center bg-white/10 backdrop-blur-md p-4 rounded-2xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-200">Published Exams</p>
            <p className="text-xl font-black mt-0.5">{results.length}</p>
          </div>
          <div className="border-l border-white/20 pl-6">
            <p className="text-[10px] uppercase font-bold text-emerald-200">Passed</p>
            <p className="text-xl font-black mt-0.5">{results.filter(r => r.is_passed).length}</p>
          </div>
        </div>
      </div>

      {/* Published Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Official Examination Grades</span>
          </h3>
          <span className="text-[11px] text-slate-400">Published Evaluations Only</span>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No published examination results available yet. Results appear here as soon as instructors publish them.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Examination</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5 text-center">Correct / Wrong</th>
                  <th className="px-5 py-3.5 text-right">Final Score</th>
                  <th className="px-5 py-3.5 text-right">Percentage</th>
                  <th className="px-5 py-3.5 text-center">Rank</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {res.exam?.title}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {res.exam?.subject?.name}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold">
                      <span className="text-emerald-600">{res.correct_count}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-600">{res.wrong_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                      {res.final_score}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      {res.percentage}%
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-black">
                      {res.rank ? `#${res.rank}` : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        res.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {res.is_passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/student-portal/results/${res.id}`}
                        className="px-3 py-1.5 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 font-bold hover:underline"
                      >
                        Inspect Breakdown
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

