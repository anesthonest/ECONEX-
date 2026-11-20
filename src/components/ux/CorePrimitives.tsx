/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Core Accessible Design Primitives
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { translateHttpError } from '../../utils/errorMessages.ts';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { useOffline } from '../../context/OfflineContext.tsx';

export const PrimaryActionButton: React.FC<{
  icon?: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'gold' | 'surface' | 'outline';
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
}> = ({ icon, label, description, onClick, variant = 'gold', type = 'button', disabled = false, fullWidth = false }) => {
  const base =
    variant === 'gold'
      ? 'bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold border border-[#D4AF37]'
      : variant === 'surface'
        ? 'bg-[#181818] hover:bg-[#222226] text-[#F5F5F5] border border-[#27272a] hover:border-[#D4AF37]/60'
        : 'bg-transparent hover:bg-[#121212] text-[#F5F5F5] border border-[#27272a] hover:border-[#C0C0C0]';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[48px] px-5 py-3 rounded-xl transition-colors flex items-center gap-3 text-left disabled:opacity-50 cursor-pointer ${
        fullWidth ? 'w-full justify-between' : 'justify-center'
      } ${base}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-semibold leading-snug">{label}</div>
          {description && (
            <div className={`text-xs mt-0.5 ${variant === 'gold' ? 'text-[#181818]' : 'text-[#A0A0A0]'}`}>
              {description}
            </div>
          )}
        </div>
      </div>
      {fullWidth && <ChevronRight size={18} className="shrink-0 opacity-75" aria-hidden="true" />}
    </button>
  );
};

export const UserWelcomeCard: React.FC<{
  firstName: string;
  roleLabel: string;
  district: string;
  verified?: boolean;
  onSpeakWelcome?: () => void;
}> = ({ firstName, roleLabel, district, verified, onSpeakWelcome }) => {
  const { t } = useExperience();
  return (
    <section aria-label="Welcome summary" className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
          <span>{roleLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{district}</span>
          <span aria-hidden="true">·</span>
          <VerificationBadge verified={Boolean(verified)} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
          {t('welcome_greeting')}, {firstName}
        </h1>
        <p className="text-base text-[#C0C0C0]">{t('what_to_do_today')}</p>
      </div>
      {onSpeakWelcome && (
        <button
          type="button"
          onClick={onSpeakWelcome}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 shrink-0 self-start sm:self-center cursor-pointer"
          aria-label="Listen to this page summary"
        >
          <Volume2 size={18} className="text-[#D4AF37]" aria-hidden="true" />
          <span>{t('voice_read_aloud')}</span>
        </button>
      )}
    </section>
  );
};

export const VerificationBadge: React.FC<{ verified: boolean }> = ({ verified }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${verified ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
    {verified ? <ShieldCheck size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
    <span>{verified ? 'Account verified' : 'We are checking your account'}</span>
  </span>
);

export const OfflineStatusIndicator: React.FC<{ onOpenSync?: () => void }> = ({ onOpenSync }) => {
  const { isSimulatedOffline, toggleSimulatedOffline, pendingCount, isSyncing, lastSyncResult, lastSyncedAt, syncNow } = useOffline();
  const [browserOffline, setBrowserOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const onOff = () => setBrowserOffline(true);
    const onOn = () => setBrowserOffline(false);
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    return () => {
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
    };
  }, []);

  const offline = isSimulatedOffline || browserOffline;
  const syncFailed = Boolean(lastSyncResult?.toLowerCase().includes('failed') || lastSyncResult?.toLowerCase().includes('error'));
  const formattedLastUpdate = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  let stateIcon = <Wifi size={15} className="text-emerald-400" aria-hidden="true" />;
  let stateText = 'Online';
  let detailText = formattedLastUpdate ? `Last updated: ${formattedLastUpdate}` : 'Connected to live ECONEX records';

  if (isSyncing) {
    stateIcon = <RefreshCw size={15} className="text-[#D4AF37] animate-spin" aria-hidden="true" />;
    stateText = 'Synchronizing';
    detailText = 'Sending your saved work...';
  } else if (syncFailed) {
    stateIcon = <AlertTriangle size={15} className="text-red-400" aria-hidden="true" />;
    stateText = 'Synchronization failed';
    detailText = 'Drafts remain safely saved on this device · Retry when online';
  } else if (offline && pendingCount > 0) {
    stateIcon = <WifiOff size={15} className="text-[#D4AF37]" aria-hidden="true" />;
    stateText = 'Offline · Saved on this device';
    detailText = `${pendingCount} waiting to synchronize (not yet confirmed by server)`;
  } else if (offline) {
    stateIcon = <WifiOff size={15} className="text-[#D4AF37]" aria-hidden="true" />;
    stateText = 'Offline';
    detailText = 'Prepare drafts safely on this device';
  } else if (pendingCount > 0) {
    stateIcon = <Clock size={15} className="text-[#D4AF37]" aria-hidden="true" />;
    stateText = 'Saved on this device · Waiting to synchronize';
    detailText = `${pendingCount} pending confirmation`;
  }

  return (
    <div className="bg-[#121212] border border-[#27272a] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        {stateIcon}
        <div>
          <span className="font-semibold text-[#F5F5F5]">{stateText}</span>
          <span className="text-[#A0A0A0] ml-2">{detailText}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(pendingCount > 0 || syncFailed) && !offline && (
          <button
            type="button"
            onClick={syncNow}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold hover:bg-[#e5bf43] cursor-pointer"
          >
            {syncFailed ? 'Retry Sync' : `Sync Now (${pendingCount})`}
          </button>
        )}
        {onOpenSync && pendingCount > 0 && (
          <button
            type="button"
            onClick={onOpenSync}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-[#181818] border border-[#27272a] text-[#C0C0C0] hover:text-[#F5F5F5] cursor-pointer"
          >
            View Saved Drafts
          </button>
        )}
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#181818] border border-[#27272a] text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
        >
          {isSimulatedOffline ? 'Go Back Online' : 'Work Offline'}
        </button>
      </div>
    </div>
  );
};

export const ProgressIndicator: React.FC<{ currentStep: number; totalSteps: number; stepLabel: string }> = ({
  currentStep,
  totalSteps,
  stepLabel,
}) => {
  const pct = Math.min(100, Math.max(5, Math.round((currentStep / totalSteps) * 100)));
  return (
    <div className="space-y-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={stepLabel}>
      <div className="flex items-center justify-between text-xs text-[#C0C0C0]">
        <span className="font-medium text-[#F5F5F5]">Step {currentStep} of {totalSteps}: {stepLabel}</span>
        <span className="tabular-nums text-[#A0A0A0]">{pct}%</span>
      </div>
      <div className="h-2.5 w-full bg-[#181818] border border-[#27272a] rounded-full overflow-hidden">
        <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center space-y-3">
    <div className="w-12 h-12 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-center mx-auto text-[#D4AF37]">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-[#F5F5F5]">{title}</h3>
    <p className="text-sm text-[#A0A0A0] max-w-md mx-auto leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <div className="pt-2">
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    )}
  </div>
);

export const ErrorRecoveryPanel: React.FC<{
  error: unknown;
  statusCode?: number;
  isAdmin?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  onSignIn?: () => void;
  onOpenHelp?: () => void;
}> = ({ error, statusCode, isAdmin = false, onRetry, onGoHome, onSignIn, onOpenHelp }) => {
  const info = translateHttpError(error, statusCode);
  const [showTech, setShowTech] = useState(false);

  return (
    <section role="alert" className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-center shrink-0 text-[#D4AF37]">
          {info.statusCode === 403 || info.statusCode === 401 ? <Lock size={20} aria-hidden="true" /> : <ShieldAlert size={20} aria-hidden="true" />}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">{info.title}</h2>
          <p className="text-base text-[#F5F5F5]">{info.userMessage}</p>
          <p className="text-sm text-[#A0A0A0]">{info.recoveryHint}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Home</span>
          </button>
        )}
        {info.statusCode === 401 && onSignIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37]/60 text-[#F5F5F5] text-sm font-medium cursor-pointer"
          >
            Sign In Again
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#C0C0C0] text-[#F5F5F5] text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>Try Again</span>
          </button>
        )}
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <HelpCircle size={16} aria-hidden="true" />
            <span>Get Help</span>
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="pt-3 border-t border-[#27272a]">
          <button
            type="button"
            onClick={() => setShowTech((s) => !s)}
            className="text-xs text-[#A0A0A0] hover:text-[#F5F5F5] underline cursor-pointer"
          >
            {showTech ? 'Hide operator diagnostics' : 'Show operator diagnostics'}
          </button>
          {showTech && (
            <pre className="mt-2 p-3 rounded-lg bg-[#050505] border border-[#27272a] text-xs font-mono text-[#C0C0C0] overflow-x-auto">
              HTTP {info.statusCode} — {info.technicalDetail}
            </pre>
          )}
        </div>
      )}
    </section>
  );
};

export const AccessibleDialog: React.FC<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, title, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="econex-dialog-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 border-b border-[#27272a] pb-3">
          <h2 id="econex-dialog-title" className="text-lg font-semibold text-[#F5F5F5]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#181818] cursor-pointer"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const GuidedForm: React.FC<{
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  helperText: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isSubmitting?: boolean;
  children: React.ReactNode;
}> = ({ currentStep, totalSteps, stepTitle, helperText, onBack, onNext, nextLabel = 'Continue', isSubmitting, children }) => (
  <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-5">
    <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabel={stepTitle} />
    <p className="text-sm text-[#C0C0C0] leading-relaxed">{helperText}</p>
    <div className="space-y-4">{children}</div>
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#27272a]">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] hover:border-[#C0C0C0] cursor-pointer"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onNext}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : nextLabel}
        </button>
      )}
    </div>
  </div>
);

export const StatusLabel: React.FC<{ tone: 'good' | 'wait' | 'warn' | 'neutral'; label: string }> = ({ tone, label }) => {
  const icon =
    tone === 'good' ? (
      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" aria-hidden="true" />
    ) : tone === 'warn' ? (
      <AlertTriangle size={15} className="text-red-400 shrink-0" aria-hidden="true" />
    ) : tone === 'wait' ? (
      <Clock size={15} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
    ) : (
      <ShieldCheck size={15} className="text-[#C0C0C0] shrink-0" aria-hidden="true" />
    );

  const color =
    tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-red-400' : tone === 'wait' ? 'text-[#D4AF37]' : 'text-[#C0C0C0]';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
