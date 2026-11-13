import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    institution_name: '',
    academic_year: '',
    default_marks_per_question: '1.00',
    default_negative_marks: '0.25',
    bubble_fill_threshold: '0.45',
    bubble_uncertain_threshold: '0.15',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/settings');
        if (res.data.success) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/settings', { settings });
      if (res.data.success) {
        setMessage("System settings successfully updated.");
      }
    } catch (err) {
      alert("Failed to save settings: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading system settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-primary-600" />
          <span>System Configuration & Recognition Tuning</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tune institution branding, academic terms, and computer vision bubble detection parameters
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-xs text-emerald-700 font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Institutional Branding */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Institutional Branding
          </h3>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Institution Name (Appears on Printable OMR Sheets)
            </label>
            <input
              type="text"
              required
              value={settings.institution_name}
              onChange={e => setSettings({ ...settings, institution_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Current Academic Year / Session
            </label>
            <input
              type="text"
              required
              value={settings.academic_year}
              onChange={e => setSettings({ ...settings, academic_year: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Vision Calibration */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Computer Vision Fill Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Bubble Fill Threshold (0.10 - 0.90)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.10"
                max="0.90"
                required
                value={settings.bubble_fill_threshold}
                onChange={e => setSettings({ ...settings, bubble_fill_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Minimum black pixel ratio to consider a bubble filled</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Ambiguity Threshold Spread
              </label>
              <input
                type="number"
                step="0.02"
                min="0.05"
                max="0.40"
                required
                value={settings.bubble_uncertain_threshold}
                onChange={e => setSettings({ ...settings, bubble_uncertain_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Triggers manual review when top 2 options differ by less than this</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save System Settings"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}

