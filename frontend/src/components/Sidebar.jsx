import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  FileText, 
  CheckSquare, 
  Users, 
  GraduationCap, 
  History, 
  Award, 
  Settings, 
  BookOpen, 
  Shield, 
  Printer, 
  UserCheck,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, isSuperAdmin, isTeacher, isStudent } = useAuth();

  const adminTeacherLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scanner', label: 'OMR Scanner', icon: Camera, highlight: true },
    { to: '/exams', label: 'Examinations', icon: FileText },
    { to: '/exams/sheets', label: 'Generate Sheets', icon: Printer },
    { to: '/scan-history', label: 'Scan History', icon: History },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/academics/classes', label: 'Classes & Batches', icon: Layers },
    ...(isSuperAdmin ? [
      { to: '/teachers', label: 'Faculty & Teachers', icon: UserCheck },
      { to: '/settings', label: 'System Settings', icon: Settings },
    ] : [])
  ];

  const studentLinks = [
    { to: '/student-portal', label: 'My Results', icon: Award },
    { to: '/profile', label: 'My Profile', icon: GraduationCap },
  ];

  const navLinks = isStudent ? studentLinks : adminTeacherLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-brand-500 flex items-center justify-center shadow-md shadow-primary-500/20 text-white font-bold text-lg">
              S
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">Smart<span className="text-primary-600">OMR</span></span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Evaluation System</span>
            </div>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed in as</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isSuperAdmin ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
            isTeacher ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          }`}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 font-semibold shadow-xs'
                    : item.highlight
                    ? 'bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    item.highlight ? 'text-emerald-600 dark:text-emerald-400' : ''
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">SmartOMR Platform v2.0</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">High-Precision Computer Vision</p>
        </div>
      </aside>
    </>
  );
}

