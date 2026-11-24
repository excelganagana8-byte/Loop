import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../ui/Badge.jsx';

export const Topbar = ({ onOpenSidebar }) => {
  const { user, workspace, role, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">Workspace:</span>
          <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
            {workspace?.name || 'My Workspace'}
          </span>
          <Badge variant="default" size="sm" className="hidden md:inline-flex uppercase text-[10px]">
            {role || 'MEMBER'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-semibold text-xs flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
