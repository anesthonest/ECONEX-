/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Experience Mode, Language & Accessibility Context
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/index.ts';
import { EconexLanguageCode, SUPPORTED_LANGUAGES, translate, EconexTranslationKey } from '../i18n/econexTranslations.ts';

export type ExperienceMode = 'SIMPLE' | 'STANDARD' | 'PROFESSIONAL' | 'ADMINISTRATOR';
export type TextSizeScale = 'normal' | 'large' | 'xlarge';

interface OnboardingDraft {
  step: number;
  language: EconexLanguageCode;
  accountType: string;
  fullName: string;
  phone: string;
  email: string;
  district: string;
  organizationName: string;
  interests: string[];
  identityVerifiedLater: boolean;
}

interface ExperienceContextType {
  mode: ExperienceMode;
  setMode: (next: ExperienceMode, userRole: UserRole, userId?: string) => { ok: boolean; error?: string };
  canAccessMode: (target: ExperienceMode, userRole: UserRole) => boolean;
  language: EconexLanguageCode;
  setLanguage: (lang: EconexLanguageCode) => void;
  t: (key: EconexTranslationKey) => string;
  textSize: TextSizeScale;
  setTextSize: (size: TextSizeScale) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (v: boolean) => void;
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  onboardingDraft: OnboardingDraft;
  saveOnboardingDraft: (patch: Partial<OnboardingDraft>) => void;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  step: 1,
  language: 'en',
  accountType: 'FARMER',
  fullName: '',
  phone: '+256 7',
  email: '',
  district: 'Mbale',
  organizationName: '',
  interests: ['sell_crops', 'market_prices'],
  identityVerifiedLater: true,
};

export function defaultModeForRole(role: UserRole): ExperienceMode {
  if (role === 'PLATFORM_ADMIN') return 'ADMINISTRATOR';
  if (role === 'COOPERATIVE_ADMIN' || role === 'TRANSPORTER' || role === 'BUYER') return 'SIMPLE';
  return 'SIMPLE';
}

export function canAccessExperienceMode(target: ExperienceMode, role: UserRole): boolean {
  if (target === 'ADMINISTRATOR') return role === 'PLATFORM_ADMIN';
  if (target === 'PROFESSIONAL') {
    return role === 'PLATFORM_ADMIN' || role === 'COOPERATIVE_ADMIN' || role === 'BUYER' || role === 'TRANSPORTER';
  }
  return true;
}

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

export const ExperienceProvider: React.FC<{ children: React.ReactNode; userRole: UserRole }> = ({ children, userRole }) => {
  const [mode, setModeState] = useState<ExperienceMode>(() => {
    const saved = (localStorage.getItem('econex_experience_mode') as ExperienceMode | null);
    if (saved && canAccessExperienceMode(saved, userRole)) return saved;
    return 'SIMPLE';
  });

  const [language, setLanguageState] = useState<EconexLanguageCode>(() => {
    return (localStorage.getItem('econex_language') as EconexLanguageCode) || 'en';
  });

  const [textSize, setTextSizeState] = useState<TextSizeScale>(() => {
    return (localStorage.getItem('econex_text_size') as TextSizeScale) || 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('econex_high_contrast') === 'true';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    const saved = localStorage.getItem('econex_reduced_motion');
    if (saved !== null) return saved === 'true';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [lowBandwidth, setLowBandwidthState] = useState<boolean>(() => {
    return localStorage.getItem('econex_low_bandwidth') === 'true';
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('econex_onboarding_done') !== 'false';
  });

  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>(() => {
    try {
      const raw = localStorage.getItem('econex_onboarding_draft');
      return raw ? { ...DEFAULT_DRAFT, ...JSON.parse(raw) } : DEFAULT_DRAFT;
    } catch {
      return DEFAULT_DRAFT;
    }
  });

  // Downgrade immediately if user role changes and current mode exceeds permission
  useEffect(() => {
    if (!canAccessExperienceMode(mode, userRole)) {
      setModeState('SIMPLE');
      localStorage.setItem('econex_experience_mode', 'SIMPLE');
    }
  }, [userRole, mode]);

  // Apply root accessibility font-size, direction & reduced-motion attributes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.fontSize = textSize === 'xlarge' ? '19px' : textSize === 'large' ? '17px' : '16px';
    const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    root.lang = language;
    root.dir = langMeta?.dir || 'ltr';
    root.classList.toggle('econex-high-contrast', highContrast);
    root.classList.toggle('econex-reduced-motion', reducedMotion);
  }, [textSize, language, highContrast, reducedMotion]);

  const setMode = (next: ExperienceMode, roleCheck: UserRole, userId?: string) => {
    if (!canAccessExperienceMode(next, roleCheck)) {
      return {
        ok: false,
        error: 'You do not have permission to switch to that workspace level. Sign in with an authorized role first.',
      };
    }
    setModeState(next);
    localStorage.setItem('econex_experience_mode', next);
    if (userId && typeof fetch === 'function') {
      fetch('/api/v15/experience-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': roleCheck,
          'x-tenant-id': 'TEN-UG-ELGON-01',
        },
        body: JSON.stringify({ mode: next }),
      }).catch(() => {});
    }
    return { ok: true };
  };

  const setLanguage = (lang: EconexLanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('econex_language', lang);
  };

  const setTextSize = (s: TextSizeScale) => {
    setTextSizeState(s);
    localStorage.setItem('econex_text_size', s);
  };

  const setHighContrast = (v: boolean) => {
    setHighContrastState(v);
    localStorage.setItem('econex_high_contrast', String(v));
  };

  const setReducedMotion = (v: boolean) => {
    setReducedMotionState(v);
    localStorage.setItem('econex_reduced_motion', String(v));
  };

  const setLowBandwidth = (v: boolean) => {
    setLowBandwidthState(v);
    localStorage.setItem('econex_low_bandwidth', String(v));
  };

  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    localStorage.setItem('econex_onboarding_done', 'true');
  };

  const resetOnboarding = () => {
    setOnboardingCompleted(false);
    localStorage.setItem('econex_onboarding_done', 'false');
  };

  const saveOnboardingDraft = (patch: Partial<OnboardingDraft>) => {
    setOnboardingDraft((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('econex_onboarding_draft', JSON.stringify(next));
      return next;
    });
  };

  const t = (key: EconexTranslationKey) => translate(language, key).text;

  return (
    <ExperienceContext.Provider
      value={{
        mode,
        setMode,
        canAccessMode: canAccessExperienceMode,
        language,
        setLanguage,
        t,
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion,
        lowBandwidth,
        setLowBandwidth,
        onboardingCompleted,
        completeOnboarding,
        resetOnboarding,
        onboardingDraft,
        saveOnboardingDraft,
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
};

export const useExperience = () => {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used within ExperienceProvider');
  return ctx;
};
