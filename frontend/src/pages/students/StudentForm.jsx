import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { Users, Save, ArrowLeft, AlertCircle } from 'lucide-react';

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    student_uid: `STD-${Math.floor(1000 + Math.random() * 9000)}`,
    roll_no: '',
    reg_no: `REG-${Math.floor(10000 + Math.random() * 90000)}`,
    first_name: '',
    last_name: '',
    class_id: '',
    batch_id: '',
    section_id: '',
    phone: '',
    email: '',
    status: 'active',
    create_user_account: true,
  });

  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await apiClient.get('/classes');
        if (res.data.success) {
          setClasses(res.data.data);
          if (res.data.data.length > 0 && !isEdit) {
            setFormData(prev => ({ ...prev, class_id: res.data.data[0].id.toString() }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchClasses();

    if (isEdit) {
      const fetchStudent = async () => {
        try {
          const res = await apiClient.get(`/students/${id}`);
          if (res.data.success) {
            const s = res.data.data;
            setFormData({
              student_uid: s.student_uid,
              roll_no: s.roll_no,
              reg_no: s.reg_no,
              first_name: s.first_name,
              last_name: s.last_name,
              class_id: s.class_id.toString(),
              batch_id: s.batch_id.toString(),
              section_id: s.section_id ? s.section_id.toString() : '',
              phone: s.phone || '',
              email: s.email || '',
              status: s.status,
              create_user_account: false,
            });
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchStudent();
    }
  }, [id, isEdit]);

  // When class changes, fetch batches
  useEffect(() => {
    if (!formData.class_id) return;
    const fetchBatches = async () => {
      try {
        const res = await apiClient.get(`/batches?class_id=${formData.class_id}`);
        if (res.data.success) {
          setBatches(res.data.data);
          if (!isEdit && res.data.data.length > 0) {
            setFormData(prev => ({ ...prev, batch_id: res.data.data[0].id.toString() }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchBatches();
  }, [formData.class_id, isEdit]);

  // When batch changes, fetch sections
  useEffect(() => {
    if (!formData.batch_id) return;
    const fetchSections = async () => {
      try {
        const res = await apiClient.get(`/sections?batch_id=${formData.batch_id}`);
        if (res.data.success) {
          setSections(res.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSections();
  }, [formData.batch_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.put(`/students/${id}`, formData);
      } else {
        await apiClient.post('/students', formData);
      }
      navigate('/students');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
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
            {isEdit ? "Edit Student Profile" : "Enroll New Student"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define institutional UID, class, batch assignment, and student portal credentials
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
        
        {/* Identifiers & Names */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Identity & Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Student UID
              </label>
              <input
                type="text"
                required
                value={formData.student_uid}
                onChange={e => setFormData({ ...formData, student_uid: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                required
                value={formData.roll_no}
                onChange={e => setFormData({ ...formData, roll_no: e.target.value })}
                placeholder="e.g. 101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                required
                value={formData.reg_no}
                onChange={e => setFormData({ ...formData, reg_no: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="e.g. Marcus"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="e.g. Vance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Academic Hierarchy */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Academic Placement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Batch
              </label>
              <select
                required
                value={formData.batch_id}
                onChange={e => setFormData({ ...formData, batch_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Section (Optional)
              </label>
              <select
                value={formData.section_id}
                onChange={e => setFormData({ ...formData, section_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="">-- No Section --</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact & Portal Credentials */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Contact & Student Portal Access
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@smartomr.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0199"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="pt-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_user"
                checked={formData.create_user_account}
                onChange={e => setFormData({ ...formData, create_user_account: e.target.checked })}
                className="rounded text-primary-600"
              />
              <label htmlFor="create_user" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Automatically create Student Portal login account (Default password: Student@123456)
              </label>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/students')}
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
            <span>{loading ? "Saving..." : (isEdit ? "Update Student" : "Enroll Student")}</span>
          </button>
        </div>

      </form>
    </div>
  );
}

