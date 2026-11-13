import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { Users, ArrowLeft, Award, CheckCircle2, TrendingUp, Calendar, BookOpen, Clock } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const [stdRes, resRes] = await Promise.all([
          apiClient.get(`/students/${id}`),
          apiClient.get(`/students/${id}/results`),
        ]);

        if (stdRes.data.success) {
          setStudent(stdRes.data.data);
        }
        if (resRes.data.success) {
          setResults(resRes.data.data.results || []);
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading candidate profile...</div>;
  }

  if (!student) {
    return <div className="p-12 text-center text-xs text-rose-500 font-bold">Student not found.</div>;
  }

  const passedCount = results.filter(r => r.is_passed).length;
  const avgScore = results.length > 0 ? (results.reduce((acc, r) => acc + parseFloat(r.percentage), 0) / results.length).toFixed(1) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/students')}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Profile & Academic Transcript
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional verification ID and complete OMR examination history
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{student.full_name}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                student.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
              }`}>
                {student.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              UID: {student.student_uid} • Roll #{student.roll_no} • Reg: {student.reg_no}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Class: <strong>{student.school_class?.name}</strong> • Batch: <strong>{student.batch?.name}</strong> • Section: <strong>{student.section?.name || 'Main'}</strong>
            </p>
          </div>
        </div>

        {/* Quick Performance Summary */}
        <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Exams Taken</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{results.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Passed</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{passedCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Avg Percent</p>
            <p className="text-xl font-black text-primary-600 dark:text-primary-400 mt-0.5">{avgScore}%</p>
          </div>
        </div>
      </div>

      {/* Examination History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Examination Performance Transcript
          </h3>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No examination attempts on record for this student.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Exam Title</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3 text-center">Correct / Wrong</th>
                  <th className="px-5 py-3 text-right">Score</th>
                  <th className="px-5 py-3 text-right">Percentage</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Evaluated At</th>
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
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {res.final_score}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      {res.percentage}%
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        res.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {res.is_passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400 text-[11px]">
                      {new Date(res.evaluated_at).toLocaleDateString()}
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

