'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/components/ui/Toast';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, role, logout } = useSession();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside or ESC pressed
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    showToast('Signed out successfully', undefined, 'info');
  };

  const handlePlaceholder = (feature: string) => {
    setIsOpen(false);
    showToast(`${feature} is a placeholder for this prototype.`, undefined, 'info');
  };

  const isHod = role === 'HOD';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        id="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-1.5 ring-slate-200 dark:ring-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              {user.name.charAt(0)}
            </div>
          )}
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            isHod ? 'bg-indigo-500' : 'bg-emerald-500'
          }`} />
        </div>

        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {user.name}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {isHod ? 'HOD' : 'Student'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-trigger"
          className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            {user.registerNumber && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                Reg: {user.registerNumber}
              </p>
            )}
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => handlePlaceholder('Profile')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handlePlaceholder('Settings')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
