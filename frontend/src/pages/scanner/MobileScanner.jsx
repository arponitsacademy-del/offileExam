import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import CameraScanner from '../../components/CameraScanner';
import { Camera, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, QrCode, FileText, RefreshCw } from 'lucide-react';

export default function MobileScanner() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingBlob, setPendingBlob] = useState(null);

  const navigate = useNavigate();

  // Load available active examinations
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await apiClient.get('/exams?status=active');
        if (res.data.success && res.data.data.length > 0) {
          setExams(res.data.data);
          setSelectedExamId(res.data.data[0].id.toString());
        } else {
          // If no active, fetch all
          const allRes = await apiClient.get('/exams');
          if (allRes.data.success) {
            setExams(allRes.data.data);
            if (allRes.data.data.length > 0) {
              setSelectedExamId(allRes.data.data[0].id.toString());
            }
          }
        }
      } catch (err) {
        console.error("Error fetching exams:", err);
      }
    };
    fetchExams();
  }, []);

  // When exam changes, fetch students eligible for this exam
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchExamStudents = async () => {
      try {
        const res = await apiClient.get(`/exams/${selectedExamId}/sheets/generate`);
        if (res.data.success && res.data.data.sheets) {
          const stdList = res.data.data.sheets.map(s => s.student);
          setStudents(stdList);
          if (stdList.length > 0) {
            setSelectedStudentId(stdList[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Error fetching exam students:", err);
      }
    };
    fetchExamStudents();
  }, [selectedExamId]);

  // Main capture submission handler
  const handleCapture = async (blob, confirmOverwrite = false) => {
    if (!selectedExamId) {
      setErrorMessage("Please select an examination before scanning.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setDuplicateWarning(null);
    setPendingBlob(blob);

    const formData = new FormData();
    formData.append('image', blob, 'omr_scan.jpg');
    formData.append('exam_id', selectedExamId);
    if (selectedStudentId) {
      formData.append('student_id', selectedStudentId);
    }
    if (confirmOverwrite) {
      formData.append('confirm_overwrite', '1');
    }

    try {
      const res = await apiClient.post('/omr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setScanResult(res.data.data);
      }
    } catch (err) {
      console.error("Scan error:", err);
      if (err.response?.status === 409 && err.response?.data?.is_duplicate) {
        // Duplicate submission detected! Prompt user for confirmation
        setDuplicateWarning(err.response.data);
      } else {
        setErrorMessage(
          err.response?.data?.message || 
          "Scan evaluation failed. Please make sure all 4 corner markers are visible and unobstructed."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmOverwrite = () => {
    if (pendingBlob) {
      handleCapture(pendingBlob, true);
    }
  };

  const resetForNextScan = () => {
    setScanResult(null);
    setDuplicateWarning(null);
    setErrorMessage(null);
    setPendingBlob(null);
  };

  const selectedExam = exams.find(e => e.id.toString() === selectedExamId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Camera className="w-6 h-6 text-emerald-500" />
            <span>Mobile Camera OMR Scanner</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time bubble recognition with perspective alignment and instant grading
          </p>
        </div>

        {/* Quick Link to Scan History */}
        <button
          onClick={() => navigate('/scan-history')}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
        >
          <span>View Scan History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Examination & Student Selector Header */}
      {!scanResult && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-primary-600" />
              <span>Target Examination</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary-500"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.total_questions} Questions)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Student Candidate (or Auto-detect via QR)</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Auto-identify via QR Code --</option>
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  Roll #{st.roll_no}: {st.name} ({st.student_uid})
                </option>
              ))}
            </select>
          </div>

        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Scan Evaluation Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Duplicate Warning Dialog / Alert */}
      {duplicateWarning && (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 shadow-xl space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                Existing Result Detected!
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                {duplicateWarning.message}
              </p>
              {duplicateWarning.existing_result && (
                <div className="mt-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-900/40 text-xs flex items-center space-x-4">
                  <span><strong>Previous Score:</strong> {duplicateWarning.existing_result.final_score}</span>
                  <span><strong>Percentage:</strong> {duplicateWarning.existing_result.percentage}%</span>
                  <span><strong>Date:</strong> {new Date(duplicateWarning.existing_result.evaluated_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleConfirmOverwrite}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              {isProcessing ? "Overwriting..." : "Yes, Rescan and Overwrite Result"}
            </button>
            <button
              onClick={resetForNextScan}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SUCCESSFUL EVALUATION PREVIEW (Section 14) */}
      {scanResult ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden animate-fadeIn">
          
          {/* Result Header Badge */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">OMR Sheet Evaluated Successfully</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Candidate: <strong>{scanResult.scan?.student?.full_name || 'Assigned Candidate'}</strong> (Roll #{scanResult.scan?.student?.roll_no})
                </p>
              </div>
            </div>

            {/* Scan Next OMR Button */}
            <button
              onClick={resetForNextScan}
              className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-xl hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Scan Next OMR</span>
            </button>
          </div>

          {/* Quick Metrics Breakdown */}
          {scanResult.result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 text-center p-4">
              <div className="p-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Final Score</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {scanResult.result.final_score}
                </p>
              </div>
              <div className="p-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Percentage</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {scanResult.result.percentage}%
                </p>
              </div>
              <div className="p-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Correct / Wrong</p>
                <p className="text-base font-extrabold mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400">{scanResult.result.correct_count}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-rose-600 dark:text-rose-400">{scanResult.result.wrong_count}</span>
                </p>
              </div>
              <div className="p-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Result Status</p>
                <span className={`inline-block mt-1 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  scanResult.result.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {scanResult.result.is_passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          )}

          {/* Question Breakdown Table */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Detailed Answer Comparison
            </h3>

            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Q.No</th>
                    <th className="px-4 py-2.5">Student Answer</th>
                    <th className="px-4 py-2.5">Correct Answer</th>
                    <th className="px-4 py-2.5">Evaluation</th>
                    <th className="px-4 py-2.5">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {scanResult.result?.answers?.map((ans) => (
                    <tr key={ans.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2 font-mono font-bold">{ans.question_number}</td>
                      <td className="px-4 py-2 font-bold">
                        {ans.student_answer ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {ans.student_answer}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Skipped</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300">
                        {ans.correct_answer}
                      </td>
                      <td className="px-4 py-2">
                        {ans.is_correct ? (
                          <span className="text-emerald-600 font-bold">Correct</span>
                        ) : ans.is_blank ? (
                          <span className="text-slate-400">Blank</span>
                        ) : ans.is_invalid ? (
                          <span className="text-amber-600 font-bold">Multiple Marked</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Wrong</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono font-bold">
                        {ans.score_awarded > 0 ? `+${ans.score_awarded}` : ans.score_awarded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => navigate(`/scanner/review/${scanResult.scan.id}`)}
                className="text-xs text-primary-600 hover:underline font-bold"
              >
                Inspect Visual Coordinate Overlay & Manual Review
              </button>

              <button
                onClick={resetForNextScan}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Scan Another Sheet</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* CAMERA SCANNER VIEWPORT */
        <CameraScanner onCapture={handleCapture} isProcessing={isProcessing} />
      )}

    </div>
  );
}

