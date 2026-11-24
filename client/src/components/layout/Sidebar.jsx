import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  Sparkles,
  MessageSquareText,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Feedback Inbox', path: '/inbox', icon: Inbox },
  { name: 'Submit Feedback', path: '/submit', icon: PlusCircle },
  { name: 'AI Insights', path: '/insights', icon: Sparkles },
  { name: 'Ask LOOP', path: '/ask', icon: MessageSquareText },
  { name: 'Team & Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { workspace, role } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <NavLink to="/inbox" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight leading-none">LOOP</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">FEEDBACK AI</span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Workspace Badge */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs uppercase">
              {workspace?.name ? workspace.name.charAt(0) : 'W'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{workspace?.name || 'My Workspace'}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{role || 'MEMBER'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
