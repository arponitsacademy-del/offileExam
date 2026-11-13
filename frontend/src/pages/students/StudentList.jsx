import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { Users, Plus, Upload, Download, Search, Filter, Edit3, Trash2, Award, ArrowRight } from 'lucide-react';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef(null);

  const navigate = useNavigate();

  // Load classes & batches
  useEffect(() => {
    const fetchAcademicLookups = async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          apiClient.get('/classes'),
          apiClient.get('/batches'),
        ]);
        if (cRes.data.success) setClasses(cRes.data.data);
        if (bRes.data.success) setBatches(bRes.data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAcademicLookups();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = '/students?';
      if (selectedClass) url += `class_id=${selectedClass}&`;
      if (selectedBatch) url += `batch_id=${selectedBatch}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await apiClient.get(url);
      if (res.data.success) {
        setStudents(res.data.data.data || res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedBatch, search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate or remove this student?")) return;
    try {
      const res = await apiClient.delete(`/students/${id}`);
      if (res.data.success) {
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const handleExportCsv = () => {
    window.open(`${apiClient.defaults.baseURL}/students/export-csv`, '_blank');
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClass || !selectedBatch) {
      alert("Please select a target Class and Batch in the filters above before importing CSV roster.");
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('csv_file', file);
    formData.append('class_id', selectedClass);
    formData.append('batch_id', selectedBatch);

    try {
      const res = await apiClient.post('/students/import-csv', formData);
      if (res.data.success) {
        alert(res.data.message);
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-primary-600" />
            <span>Student Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage student registrations, academic batch assignments, and examination performance profiles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCsv}
            accept=".csv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5"
            title="Import student roster from CSV"
          >
            <Upload className="w-4 h-4" />
            <span>{importing ? "Importing..." : "Import CSV"}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/students/create"
            className="px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Student</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or reg ID..."
            className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
        >
          <option value="">All Academic Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

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
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No students found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Student UID</th>
                  <th className="px-5 py-3.5">Registration No</th>
                  <th className="px-5 py-3.5">Class & Batch</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      #{student.roll_no}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      <Link to={`/students/${student.id}`} className="hover:text-primary-600">
                        {student.full_name}
                      </Link>
                      {student.email && (
                        <span className="block text-[10px] text-slate-400 font-normal">{student.email}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {student.student_uid}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {student.reg_no}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{student.school_class?.name}</p>
                      <p className="text-[11px] text-slate-400">{student.batch?.name} • {student.section?.name || 'Main'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        student.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/students/${student.id}`}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                          title="View Exam History"
                        >
                          <Award className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/students/${student.id}/edit`}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                          title="Deactivate or Remove"
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

