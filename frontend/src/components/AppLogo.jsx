import React from 'react';

export const LOGO_SRC = '/pe-academy-logo.png';
export const SCHOOL_NAME = 'P.E Academy';
export const SYSTEM_NAME = 'Teacher Attendance System';

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
};

export default function AppLogo({ size = 'md', className = '' }) {
  return (
    <img
      src={LOGO_SRC}
      alt={`${SCHOOL_NAME} logo`}
      className={`object-contain ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  );
}

export function BrandHeader({ subtitle, size = 'lg', dark = true, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <AppLogo size={size} className="mx-auto mb-4 drop-shadow-lg" />
      <h1 className={`text-2xl sm:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
        {SCHOOL_NAME}
      </h1>
      {subtitle && (
        <p className={`mt-1 text-sm ${dark ? 'text-slate-300' : 'text-gray-500'}`}>{subtitle}</p>
      )}
    </div>
  );
}

export function SidebarBrand({ panelLabel, className = '' }) {
  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <AppLogo size="sm" className="flex-shrink-0 bg-white rounded-lg p-0.5" />
      <div className="min-w-0">
        <span className="font-bold text-base text-white block truncate">{SCHOOL_NAME}</span>
        {panelLabel && <p className="text-xs text-white/70 truncate">{panelLabel}</p>}
      </div>
    </div>
  );
}
