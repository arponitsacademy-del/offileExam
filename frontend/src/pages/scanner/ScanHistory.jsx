import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { History, Camera, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Filter } from 'lucide-react';

export default function ScanHistory() {
  const [scans, setScans] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await apiClient.get('/exams');
        if (res.data.success) {
          setExams(res.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchExams();
  }, []);

  const fetchScans = async () => {
    setLoading(true);
    try {
      let url = '/omr/scans?';
      if (selectedExam) url += `exam_id=${selectedExam}&`;
      if (selectedStatus) url += `status=${selectedStatus}&`;

      const res = await apiClient.get(url);
      if (res.data.success) {
        setScans(res.data.data.data || res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [selectedExam, selectedStatus]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-primary-600" />
            <span>OMR Scan Audit Trail & History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete log of all scanned examination sheets with computer vision confidence and review states
          </p>
        </div>

        <Link
          to="/scanner"
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
        >
          <Camera className="w-4 h-4" />
          <span>New OMR Scan</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>

        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
        >
          <option value="">All Examinations</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
        >
          <option value="">All Processing Statuses</option>
          <option value="completed">Completed</option>
          <option value="requires_review">Requires Review</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Scans Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading scan logs...</div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No OMR scans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Scan UID</th>
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Examination</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Scanned By</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                      {scan.scan_uid}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">
                      {scan.student ? (
                        <div>
                          <p>{scan.student.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">Roll #{scan.student.roll_no}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned (QR Not Linked)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-600 dark:text-slate-300">
                      {scan.exam?.title}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        scan.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        scan.status === 'requires_review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {scan.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {scan.alignment_confidence ? `${Math.round(scan.alignment_confidence * 100)}%` : 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {scan.scanner?.name || 'Faculty'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px]">
                      {new Date(scan.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/scanner/review/${scan.id}`}
                        className="px-3 py-1.5 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 font-bold hover:underline"
                      >
                        Inspect / Review
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

