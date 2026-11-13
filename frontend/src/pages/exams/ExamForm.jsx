import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { FileText, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ExamForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    exam_code: `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
    title: '',
    description: '',
    subject_id: '',
    class_id: '',
    template_id: '',
    total_questions: '25',
    exam_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    marks_per_question: 1.00,
    negative_marks_per_question: 0.25,
    passing_marks: 10.00,
    invalid_marking_penalty: 0.00,
    status: 'active',
    allow_multiple_attempts: false,
    batch_ids: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load lookup options
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [subRes, classRes, templRes] = await Promise.all([
          apiClient.get('/subjects'),
          apiClient.get('/classes'),
          apiClient.get('/omr-templates'),
        ]);

        if (subRes.data.success) setSubjects(subRes.data.data);
        if (classRes.data.success) {
          setClasses(classRes.data.data);
          if (classRes.data.data.length > 0 && !isEdit) {
            setFormData(prev => ({ ...prev, class_id: classRes.data.data[0].id.toString() }));
          }
        }
        if (templRes.data.success) {
          setTemplates(templRes.data.data);
          if (templRes.data.data.length > 0 && !isEdit) {
            setFormData(prev => ({ ...prev, template_id: templRes.data.data[0].id.toString() }));
          }
        }
        if (subRes.data.data.length > 0 && !isEdit) {
          setFormData(prev => ({ ...prev, subject_id: subRes.data.data[0].id.toString() }));
        }

        // If editing, load existing exam
        if (isEdit) {
          const examRes = await apiClient.get(`/exams/${id}`);
          if (examRes.data.success) {
            const e = examRes.data.data;
            setFormData({
              exam_code: e.exam_code,
              title: e.title,
              description: e.description || '',
              subject_id: e.subject_id.toString(),
              class_id: e.class_id.toString(),
              template_id: e.template_id.toString(),
              total_questions: e.total_questions.toString(),
              exam_date: e.exam_date,
              duration_minutes: e.duration_minutes,
              marks_per_question: e.marks_per_question,
              negative_marks_per_question: e.negative_marks_per_question,
              passing_marks: e.passing_marks,
              invalid_marking_penalty: e.invalid_marking_penalty,
              status: e.status,
              allow_multiple_attempts: e.allow_multiple_attempts,
              batch_ids: e.batches ? e.batches.map(b => b.id) : [],
            });
          }
        }
      } catch (err) {
        console.error("Lookups fetch error:", err);
      }
    };
    fetchLookups();
  }, [id, isEdit]);

  // Load batches when class changes
  useEffect(() => {
    if (!formData.class_id) return;
    const fetchBatches = async () => {
      try {
        const res = await apiClient.get(`/batches?class_id=${formData.class_id}`);
        if (res.data.success) {
          setBatches(res.data.data);
          if (!isEdit && res.data.data.length > 0 && formData.batch_ids.length === 0) {
            setFormData(prev => ({ ...prev, batch_ids: [res.data.data[0].id] }));
          }
        }
      } catch (err) {
        console.error("Batches fetch error:", err);
      }
    };
    fetchBatches();
  }, [formData.class_id, isEdit]);

  // Update total questions when template selection changes
  const handleTemplateChange = (tmplId) => {
    const tmpl = templates.find(t => t.id.toString() === tmplId.toString());
    setFormData(prev => ({
      ...prev,
      template_id: tmplId,
      total_questions: tmpl ? tmpl.total_questions.toString() : prev.total_questions,
    }));
  };

  const handleBatchToggle = (batchId) => {
    setFormData(prev => {
      const exists = prev.batch_ids.includes(batchId);
      return {
        ...prev,
        batch_ids: exists 
          ? prev.batch_ids.filter(b => b !== batchId)
          : [...prev.batch_ids, batchId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.batch_ids.length === 0) {
      setError("Please assign at least one student batch to this examination.");
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        await apiClient.put(`/exams/${id}`, formData);
      } else {
        await apiClient.post('/exams', formData);
      }
      navigate('/exams');
    } catch (err) {
      console.error("Exam save error:", err);
      setError(err.response?.data?.message || "Failed to save examination.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/exams')}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEdit ? "Edit Examination Parameters" : "Create New Examination"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define MCQ structure, grading rubrics, negative marking, and student batch eligibility
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Information Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            General Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Exam Code
              </label>
              <input
                type="text"
                required
                value={formData.exam_code}
                onChange={e => setFormData({ ...formData, exam_code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Examination Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Physics Midterm Multiple Choice 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Subject
              </label>
              <select
                required
                value={formData.subject_id}
                onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Academic Class
              </label>
              <select
                required
                value={formData.class_id}
                onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                OMR Template Layout
              </label>
              <select
                required
                value={formData.template_id}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.total_questions} Questions)</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scoring & Rules Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Marking Scheme & Scheduling
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Correct Marks (+)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                required
                value={formData.marks_per_question}
                onChange={e => setFormData({ ...formData, marks_per_question: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Negative Penalty (-)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                required
                value={formData.negative_marks_per_question}
                onChange={e => setFormData({ ...formData, negative_marks_per_question: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Passing Marks
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={formData.passing_marks}
                onChange={e => setFormData({ ...formData, passing_marks: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                required
                value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Exam Date
              </label>
              <input
                type="date"
                required
                value={formData.exam_date}
                onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Examination Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="draft">Draft (Preparing)</option>
                <option value="active">Active (Ready for Scanning)</option>
                <option value="completed">Completed (Archived)</option>
                <option value="published">Published (Results live to students)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assigned Batches Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Assigned Student Batches
          </h3>
          <p className="text-xs text-slate-400">
            Select which student batches are participating in this examination:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {batches.map(b => {
              const isChecked = formData.batch_ids.includes(b.id);
              return (
                <div
                  key={b.id}
                  onClick={() => handleBatchToggle(b.id)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${
                    isChecked
                      ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by wrapper
                    className="rounded text-primary-600 pointer-events-none"
                  />
                  <span className="text-xs">{b.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving..." : (isEdit ? "Update Examination" : "Save Examination")}</span>
          </button>
        </div>

      </form>
    </div>
  );
}

