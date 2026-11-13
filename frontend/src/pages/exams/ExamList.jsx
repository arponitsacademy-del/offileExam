import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { 
  FileText, 
  Plus, 
  KeyRound, 
  Printer, 
  Award, 
  Copy, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Search,
  Camera,
  Layers
} from 'lucide-react';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/exams');
      if (res.data.success) {
        setExams(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDuplicate = async (id) => {
    try {
      const res = await apiClient.post(`/exams/${id}/duplicate`);
      if (res.data.success) {
        fetchExams();
      }
    } catch (err) {
      alert("Duplicate failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this examination?")) return;
    try {
      const res = await apiClient.delete(`/exams/${id}`);
      if (res.data.success) {
        fetchExams();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete exam.");
    }
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.exam_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-600" />
            <span>Examination Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure examination schedules, assign student batches, set answer keys, and track grading
          </p>
        </div>

        <Link
          to="/exams/create"
          className="px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Examination</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search examinations by title or exam code..."
          className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Examinations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading examinations...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No examinations found. Create your first exam above!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Exam Code & Title</th>
                  <th className="px-5 py-3.5">Subject & Class</th>
                  <th className="px-5 py-3.5">MCQ Count</th>
                  <th className="px-5 py-3.5">Marking Rule</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      <div>
                        <span className="font-mono text-[11px] text-primary-600 block">{exam.exam_code}</span>
                        <span className="text-sm">{exam.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{exam.subject?.name}</p>
                      <p className="text-[11px] text-slate-400">{exam.school_class?.name}</p>
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono">
                      {exam.total_questions} Questions
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-600 font-bold">+{exam.marks_per_question}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-600 font-bold">-{exam.negative_marks_per_question}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {exam.exam_date}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        exam.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        exam.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/exams/${exam.id}/answer-key`}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                          title="Configure Answer Key"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/exams/${exam.id}/sheets`}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          title="Generate Printable OMR Sheets"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/exams/${exam.id}/merit-list`}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                          title="View Merit List & Results"
                        >
                          <Award className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/exams/${exam.id}/edit`}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                          title="Edit Exam"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(exam.id)}
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
                          title="Duplicate Exam"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

