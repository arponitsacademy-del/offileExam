import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Award, Download, Search, CheckCircle2, Trophy, TrendingUp, Users, ArrowLeft, Filter, Sparkles } from 'lucide-react';

export default function MeritList() {
  const { id } = useParams();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(id || '');
  const [meritData, setMeritData] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);

  // Load examinations
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await apiClient.get('/exams');
        if (res.data.success && res.data.data.length > 0) {
          setExams(res.data.data);
          if (!selectedExamId) {
            setSelectedExamId(res.data.data[0].id.toString());
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchExams();
  }, []);

  // Fetch merit list
  const fetchMeritList = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      let url = `/exams/${selectedExamId}/merit-list?`;
      if (selectedBatch) url += `batch_id=${selectedBatch}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await apiClient.get(url);
      if (res.data.success) {
        setMeritData(res.data.data);
        if (res.data.data.exam?.batches) {
          setBatches(res.data.data.exam.batches);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeritList();
  }, [selectedExamId, selectedBatch, search]);

  const handlePublish = async () => {
    if (!selectedExamId) return;
    setPublishing(true);
    setPublishSuccess(null);
    try {
      const res = await apiClient.post(`/exams/${selectedExamId}/results/publish`);
      if (res.data.success) {
        setPublishSuccess(res.data.message);
        fetchMeritList();
      }
    } catch (err) {
      alert("Failed to publish results: " + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  const handleExportCsv = () => {
    if (!selectedExamId) return;
    window.open(`${apiClient.defaults.baseURL}/exams/${selectedExamId}/merit-list/export-csv`, '_blank');
  };

  const stats = meritData?.statistics || {};
  const meritList = meritData?.merit_list || [];
  const exam = meritData?.exam;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>Examination Merit List & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Class rankings generated from finalized OMR evaluation scores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            disabled={meritList.length === 0}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {exam?.status !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={publishing || meritList.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{publishing ? "Publishing..." : "Publish to Student Portal"}</span>
            </button>
          )}
        </div>
      </div>

      {publishSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{publishSuccess}</span>
        </div>
      )}

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Evaluated</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{stats.total_candidates || 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Highest Score</p>
            <p className="text-xl font-black text-amber-600">{stats.highest_score || 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Average Score</p>
            <p className="text-xl font-black text-purple-600">{stats.average_score || 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Pass Percentage</p>
            <p className="text-xl font-black text-emerald-600">{stats.pass_percentage || 0}%</p>
          </div>
        </div>

      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate by name or roll number..."
            className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        {batches.length > 0 && (
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Merit List Rankings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Calculating rank hierarchy...</div>
        ) : meritList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No finalized results available for this examination yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Batch</th>
                  <th className="px-5 py-3 text-center">Correct</th>
                  <th className="px-5 py-3 text-center">Wrong</th>
                  <th className="px-5 py-3 text-center">Blank</th>
                  <th className="px-5 py-3 text-right">Final Score</th>
                  <th className="px-5 py-3 text-right">Percentage</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {meritList.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono font-black text-sm">
                      {res.rank === 1 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                          <span>🥇 #1</span>
                        </span>
                      ) : res.rank === 2 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                          <span>🥈 #2</span>
                        </span>
                      ) : res.rank === 3 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 font-bold text-xs">
                          <span>🥉 #3</span>
                        </span>
                      ) : (
                        `#${res.rank}`
                      )}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                      <div>
                        <span>{res.student?.full_name}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">Roll #{res.student?.roll_no} • Reg {res.student?.reg_no}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {res.student?.batch?.name}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {res.correct_count}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                      {res.wrong_count}
                    </td>
                    <td className="px-5 py-3 text-center text-slate-400">
                      {res.blank_count}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                      {res.final_score}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      {res.percentage}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        res.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {res.is_passed ? 'PASS' : 'FAIL'}
                      </span>
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

