import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Layers, Plus, BookOpen, Users, Save, CheckCircle2 } from 'lucide-react';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Class Form State
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classDesc, setClassDesc] = useState('');

  // New Batch Form State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchClassId, setBatchClassId] = useState('');
  const [batchSession, setBatchSession] = useState('2026-2027');
  const [batchMaxStudents, setBatchMaxStudents] = useState(80);

  // New Subject Form State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDesc, setSubDesc] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, sRes] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/batches'),
        apiClient.get('/subjects'),
      ]);
      if (cRes.data.success) {
        setClasses(cRes.data.data);
        if (cRes.data.data.length > 0 && !batchClassId) {
          setBatchClassId(cRes.data.data[0].id.toString());
        }
      }
      if (bRes.data.success) setBatches(bRes.data.data);
      if (sRes.data.success) setSubjects(sRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/classes', {
        name: className,
        code: classCode,
        description: classDesc,
        status: 'active',
      });
      if (res.data.success) {
        setShowClassModal(false);
        setClassName('');
        setClassCode('');
        setClassDesc('');
        fetchData();
      }
    } catch (err) {
      alert("Failed to create class: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/batches', {
        name: batchName,
        class_id: batchClassId,
        session: batchSession,
        max_students: batchMaxStudents,
        status: 'active',
      });
      if (res.data.success) {
        setShowBatchModal(false);
        setBatchName('');
        fetchData();
      }
    } catch (err) {
      alert("Failed to create batch: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/subjects', {
        name: subName,
        code: subCode,
        description: subDesc,
      });
      if (res.data.success) {
        setShowSubjectModal(false);
        setSubName('');
        setSubCode('');
        setSubDesc('');
        fetchData();
      }
    } catch (err) {
      alert("Failed to create subject: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-primary-600" />
            <span>Academic Structure & Curriculum</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize institutional classes, examination batches, student cohorts, and academic subjects
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Batch</span>
          </button>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Grid of Sections: Classes & Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Classes Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Academic Classes</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classes.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{c.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Code: {c.code}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {c.batches_count || 0} Batches
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batches Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Users className="w-4 h-4 text-primary-600" />
            <span>Student Batches & Cohorts</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {batches.map(b => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{b.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Class: {b.school_class?.name} • Session: {b.session}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {b.students_count || 0} Students
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Subjects Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Curriculum Subjects</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase block">{s.code}</span>
              <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">{s.name}</p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description || 'No description'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Create Academic Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="e.g. HSC Class of 2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={classCode}
                  onChange={e => setClassCode(e.target.value)}
                  placeholder="e.g. HSC-2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Create Student Batch</h3>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Parent Class</label>
                <select
                  value={batchClassId}
                  onChange={e => setBatchClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder="e.g. Science Alpha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Session</label>
                <input
                  type="text"
                  value={batchSession}
                  onChange={e => setBatchSession(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Add Curriculum Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  placeholder="e.g. Higher Mathematics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={e => setSubCode(e.target.value)}
                  placeholder="e.g. MTH-201"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

