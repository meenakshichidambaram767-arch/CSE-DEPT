'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}>
      <ol className="flex items-center space-x-1.5 list-none p-0 m-0">
        <li>
          <span className="flex items-center hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <Home className="w-3.5 h-3.5 mr-1 opacity-70" />
            <span>CSE Hub</span>
          </span>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current;

          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 opacity-60" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[180px]"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
