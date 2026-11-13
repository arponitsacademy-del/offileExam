import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { KeyRound, Save, ArrowLeft, CheckCircle2, AlertTriangle, Wand2, History } from 'lucide-react';

export default function AnswerKeyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [bulkInput, setBulkInput] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [hasResults, setHasResults] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnswerKey = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/exams/${id}/answer-key`);
      if (res.data.success) {
        const data = res.data.data;
        setExam({ id: data.exam_id, title: data.exam_title, total_questions: data.total_questions });
        setHasResults(data.has_published_results);
        setVersionHistory(data.version_history || []);

        const map = {};
        for (let q = 1; q <= data.total_questions; q++) {
          map[q] = '';
        }
        if (data.active_key?.items) {
          data.active_key.items.forEach(item => {
            map[item.question_number] = item.correct_option;
          });
        }
        setAnswers(map);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load answer key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswerKey();
  }, [id]);

  const handleOptionSelect = (qNum, option) => {
    setAnswers(prev => ({ ...prev, [qNum]: option }));
  };

  const handleBulkParse = async () => {
    if (!bulkInput.trim()) return;
    try {
      const res = await apiClient.post(`/exams/${id}/answer-key/bulk-parse`, {
        raw_input: bulkInput,
      });
      if (res.data.success) {
        const parsed = res.data.data.answers;
        setAnswers(prev => {
          const updated = { ...prev };
          parsed.forEach(p => {
            updated[p.question_number] = p.correct_option;
          });
          return updated;
        });
        setMessage(`Applied ${parsed.length} answers from bulk string.`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error("Bulk parse error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const totalQuestions = exam?.total_questions || 25;
    const answeredCount = Object.values(answers).filter(Boolean).length;

    if (answeredCount < totalQuestions) {
      setError(`Answer key is incomplete (${answeredCount}/${totalQuestions} answered). Please define answers for all questions before saving.`);
      return;
    }

    if (hasResults && !changeReason.trim()) {
      setError("Results have already been recorded for this examination. A justification (change reason) is required.");
      return;
    }

    setSaving(true);
    const answersArray = Object.entries(answers).map(([q, opt]) => ({
      question_number: parseInt(q),
      correct_option: opt,
      marks_weight: 1.00,
    }));

    try {
      const res = await apiClient.put(`/exams/${id}/answer-key`, {
        answers: answersArray,
        change_reason: changeReason,
        auto_recalculate_results: true,
      });
      if (res.data.success) {
        setMessage(res.data.message);
        fetchAnswerKey();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update answer key.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading answer key configuration...</div>;
  }

  const totalQ = exam?.total_questions || 25;
  const answeredQ = Object.values(answers).filter(Boolean).length;
  const completionPercentage = Math.round((answeredQ / totalQ) * 100);
  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Official Answer Key Configuration</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exam: <strong>{exam?.title}</strong> ({totalQ} Questions)
            </p>
          </div>
        </div>

        {/* Completion Progress Badge */}
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Completion Status</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-100">{answeredQ} / {totalQ} Answered</p>
          </div>
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-amber-600">
            {completionPercentage}%
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bulk String Parser Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Wand2 className="w-3.5 h-3.5 text-primary-600" />
            <span>Fast Bulk Answer Input</span>
          </label>
          <input
            type="text"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value.toUpperCase())}
            placeholder={`Paste continuous option string e.g. "ABCDABCDAC..." (up to ${totalQ} chars)`}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest uppercase focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          type="button"
          onClick={handleBulkParse}
          className="w-full sm:w-auto mt-5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shrink-0"
        >
          Apply String
        </button>
      </div>

      {/* Interactive Answer Key Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Interactive Bubble Selector
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: totalQ }, (_, i) => i + 1).map((qNum) => {
              const currentVal = answers[qNum];
              return (
                <div 
                  key={qNum}
                  className={`p-3 rounded-2xl border transition-all ${
                    currentVal 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                      Q.{qNum}
                    </span>
                    <span className={`text-[10px] font-bold ${currentVal ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {currentVal || 'Unset'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between space-x-1">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleOptionSelect(qNum, opt)}
                        className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          currentVal === opt
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20 scale-105'
                            : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Reason Card if existing results exist */}
        {hasResults && (
          <div className="bg-amber-50 dark:bg-amber-950/40 p-6 rounded-3xl border border-amber-200 dark:border-amber-800/60 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Correction Justification (Required)</span>
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-400">
              Finalized exam results already exist for this exam. Modifying the answer key will create Version {versionHistory.length + 1} and automatically recalculate all candidate scores and merit ranks.
            </p>
            <textarea
              rows={2}
              required
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="State the reason for this key revision (e.g. Question 14 typo in original question paper)..."
              className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center space-x-2 shadow-xl shadow-primary-500/25"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving & Recalculating..." : "Save Official Answer Key"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}

