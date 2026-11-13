import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient, { STORAGE_BASE_URL } from '../../api/client';
import { CheckCircle2, AlertTriangle, ArrowLeft, Image as ImageIcon, Save, ShieldAlert } from 'lucide-react';

export default function ManualReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [corrections, setCorrections] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('annotated'); // 'annotated' or 'original'

  useEffect(() => {
    const fetchScanDetails = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/omr/scans/${id}`);
        if (res.data.success) {
          const scanData = res.data.data;
          setScan(scanData);
          setSelectedStudentId(scanData.student_id ? scanData.student_id.toString() : '');

          // Initialize corrections map from current answers
          const corr = {};
          scanData.answers?.forEach(ans => {
            corr[ans.question_number] = {
              question_number: ans.question_number,
              option: ans.detected_option,
              status: ans.status || 'single',
              comment: '',
            };
          });
          setCorrections(corr);

          // Fetch student list for this exam if needed
          if (scanData.exam_id) {
            const stdRes = await apiClient.get(`/exams/${scanData.exam_id}/sheets/generate`);
            if (stdRes.data.success) {
              setStudents(stdRes.data.data.sheets.map(s => s.student));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching scan details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScanDetails();
  }, [id]);

  const handleOptionChange = (qNum, newOption) => {
    setCorrections(prev => ({
      ...prev,
      [qNum]: {
        ...prev[qNum],
        option: newOption === '' ? null : newOption,
        status: newOption === '' ? 'blank' : 'single',
      }
    }));
  };

  const handleStatusChange = (qNum, newStatus) => {
    setCorrections(prev => ({
      ...prev,
      [qNum]: {
        ...prev[qNum],
        status: newStatus,
        option: (newStatus === 'blank' || newStatus === 'invalid') ? null : prev[qNum]?.option,
      }
    }));
  };

  const handleSaveReview = async () => {
    setSaving(true);
    setSuccessMessage(null);

    const payload = {
      student_id: selectedStudentId ? parseInt(selectedStudentId) : null,
      corrections: Object.values(corrections),
      approve_evaluation: true,
    };

    try {
      const res = await apiClient.post(`/omr/scans/${id}/review`, payload);
      if (res.data.success) {
        setSuccessMessage("Review approved and exam result recalculated successfully!");
        setScan(res.data.data.scan);
        setTimeout(() => {
          navigate('/scan-history');
        }, 1500);
      }
    } catch (err) {
      console.error("Save review error:", err);
      alert(err.response?.data?.message || "Failed to save review changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading scan inspection...</div>;
  }

  if (!scan) {
    return <div className="p-12 text-center text-xs text-rose-500 font-bold">Scan record not found.</div>;
  }

  const options = ['A', 'B', 'C', 'D'];
  const originalImageUrl = scan.original_image_path ? `${STORAGE_BASE_URL}/${scan.original_image_path}` : null;
  const processedImageUrl = scan.processed_image_path ? `${STORAGE_BASE_URL}/${scan.processed_image_path}` : null;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Manual OMR Verification & Quality Review
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect OpenCV coordinate bounding boxes, resolve uncertain markings, and finalize candidate score
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveReview}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Recalculating..." : "Approve & Recalculate"}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Review Grid: Left Image, Right Question Corrections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Scanned Image Viewport with Tabs (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('annotated')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'annotated'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Vision Annotated Overlay
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'original'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Original Camera Photo
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Alignment Confidence: {scan.alignment_confidence ? `${Math.round(scan.alignment_confidence * 100)}%` : 'N/A'}
            </span>
          </div>

          <div className="flex-1 min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-2">
            {activeTab === 'annotated' && processedImageUrl ? (
              <img
                src={processedImageUrl}
                alt="Vision Annotated OMR"
                className="max-h-[650px] w-auto object-contain rounded-lg"
              />
            ) : originalImageUrl ? (
              <img
                src={originalImageUrl}
                alt="Original Scanned Photo"
                className="max-h-[650px] w-auto object-contain rounded-lg"
              />
            ) : (
              <p className="text-xs text-slate-500">Image not available</p>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Question Answers Table (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          
          {/* Candidate Assignment Box */}
          <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Assigned Candidate Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            >
              <option value="">-- Unassigned --</option>
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  Roll #{st.roll_no}: {st.name} ({st.student_uid})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Answer Bubble Decisions
            </h3>
            <span className="text-[11px] text-slate-400">
              {scan.answers?.length || 0} Questions
            </span>
          </div>

          {/* Scrollable Questions list */}
          <div className="flex-1 max-h-[520px] overflow-y-auto space-y-2 pr-1">
            {scan.answers?.map((ans) => {
              const qNum = ans.question_number;
              const corr = corrections[qNum] || {};
              const isUncertain = ans.status === 'uncertain';
              const isMultiple = ans.status === 'multiple';

              return (
                <div 
                  key={qNum}
                  className={`p-3 rounded-2xl border transition-all ${
                    isUncertain 
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800' 
                      : isMultiple
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      Q.{qNum}
                    </span>
                    
                    {/* Status badge */}
                    <select
                      value={corr.status || 'single'}
                      onChange={(e) => handleStatusChange(qNum, e.target.value)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <option value="single">Single Mark</option>
                      <option value="blank">Blank (Skipped)</option>
                      <option value="multiple">Multiple Marked</option>
                      <option value="invalid">Invalid</option>
                    </select>
                  </div>

                  {/* Bubble selection buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleOptionChange(qNum, opt)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            corr.option === opt
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-110'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleOptionChange(qNum, '')}
                        className={`px-2.5 h-7 rounded-full text-[10px] font-bold transition-all ${
                          !corr.option
                            ? 'bg-slate-800 dark:bg-slate-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        None
                      </button>
                    </div>

                    {/* Fill ratios info tooltip */}
                    <span className="text-[10px] font-mono text-slate-400">
                      A:{(ans.fill_ratio_a*100).toFixed(0)}% B:{(ans.fill_ratio_b*100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}

