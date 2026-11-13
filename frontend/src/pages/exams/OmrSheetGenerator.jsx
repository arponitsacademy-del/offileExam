import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import OmrPrintableSheet from '../../components/OmrPrintableSheet';
import { Printer, ArrowLeft, Download, Users, FileText, CheckCircle2 } from 'lucide-react';

export default function OmrSheetGenerator() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(id || '');
  const [sheetData, setSheetData] = useState(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch list of examinations
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await apiClient.get('/exams');
        if (res.data.success) {
          setExams(res.data.data);
          if (!selectedExamId && res.data.data.length > 0) {
            setSelectedExamId(res.data.data[0].id.toString());
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchExams();
  }, []);

  // Fetch sheets when exam is chosen
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchSheets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/exams/${selectedExamId}/sheets/generate`);
        if (res.data.success) {
          setSheetData(res.data.data);
          setSelectedStudentIndex(0);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to generate sheets for this exam.");
        setSheetData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSheets();
  }, [selectedExamId]);

  const handlePrint = () => {
    window.print();
  };

  const sheets = sheetData?.sheets || [];
  const currentSheet = sheets[selectedStudentIndex];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Controls Bar (Hidden during print) */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Printer className="w-5 h-5 text-primary-600" />
              <span>Printable OMR Sheet Generator</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A4 standardized sheets with 4 corner alignment fiducials and unique student QR codes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            disabled={!currentSheet}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet (A4)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="no-print p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Student Roster Navigator (Hidden during print) */}
      {!loading && sheets.length > 0 && (
        <div className="no-print bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Select Student Sheet:</span>
          {sheets.map((s, idx) => (
            <button
              key={s.sheet_id}
              onClick={() => setSelectedStudentIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedStudentIndex === idx
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Roll #{s.student.roll_no}: {s.student.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Sheet Preview Card */}
      <div className="bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl overflow-x-auto flex justify-center">
        {loading ? (
          <div className="text-xs text-slate-400 py-12">Generating standardized sheets...</div>
        ) : currentSheet ? (
          <div className="print-area">
            <OmrPrintableSheet sheetData={currentSheet} />
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-12">No sheets generated.</div>
        )}
      </div>

    </div>
  );
}

