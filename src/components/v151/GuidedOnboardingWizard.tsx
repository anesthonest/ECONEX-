/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - 7-Step Guided First-Time Onboarding Wizard
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Sprout,
  ShoppingBag,
  Store,
  Truck,
  Building2,
  Users,
  Briefcase,
  Landmark,
  Save,
} from 'lucide-react';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { EconexLanguageCode, SUPPORTED_LANGUAGES } from '../../i18n/econexTranslations.ts';
import { GuidedForm, AccessibleDialog } from '../ux/CorePrimitives.tsx';
import { UserRole } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

const ACCOUNT_TYPE_OPTIONS: { id: string; role: UserRole; title: string; subtitle: string; icon: any }[] = [
  { id: 'INDIVIDUAL', role: 'BUYER', title: 'Individual / Household', subtitle: 'Buy food, household items, or look for services', icon: Users },
  { id: 'FARMER', role: 'FARMER', title: 'Farmer / Grower', subtitle: 'Sell harvest, check fair market prices, find buyers', icon: Sprout },
  { id: 'SMALL_TRADER', role: 'BUYER', title: 'Small Trader / Market Vendor', subtitle: 'Buy wholesale stock and manage daily customer orders', icon: Store },
  { id: 'SME', role: 'BUYER', title: 'Small & Medium Business (SME)', subtitle: 'List products, manage suppliers, send invoices', icon: ShoppingBag },
  { id: 'COOPERATIVE', role: 'COOPERATIVE_ADMIN', title: 'Cooperative / Farmers Association', subtitle: 'Aggregate member produce and negotiate contracts', icon: Users },
  { id: 'TRANSPORTER', role: 'TRANSPORTER', title: 'Logistics / Transport Provider', subtitle: 'Accept delivery jobs across districts and borders', icon: Truck },
  { id: 'SERVICE_PROVIDER', role: 'AGRO_DEALER', title: 'Agro-Dealer / Service Provider', subtitle: 'Sell certified seeds, tools, or local services', icon: Briefcase },
  { id: 'ENTERPRISE', role: 'BUYER', title: 'Large Enterprise / Processor', subtitle: 'Source raw materials and coordinate supply chains', icon: Building2 },
  { id: 'INSTITUTION', role: 'COOPERATIVE_ADMIN', title: 'Institution / Government / Financial Partner', subtitle: 'Program support, credit, or trade supervision', icon: Landmark },
];

const INTEREST_OPTIONS = [
  { id: 'sell_crops', label: 'Sell crops or products' },
  { id: 'buy_goods', label: 'Buy goods or supplies' },
  { id: 'market_prices', label: 'Check daily market prices' },
  { id: 'find_transport', label: 'Arrange delivery transport' },
  { id: 'manage_orders', label: 'Track orders and payments' },
  { id: 'find_work', label: 'Find business & tender opportunities' },
];

export const GuidedOnboardingWizard: React.FC<Props> = ({ isOpen, onClose, onFinish }) => {
  const {
    onboardingDraft,
    saveOnboardingDraft,
    completeOnboarding,
    setLanguage,
    language,
    activeCountry,
  } = useExperience();
  const { register, switchRole, currentUser, role } = useAuth();

  const [step, setStep] = useState<number>(onboardingDraft.step || 1);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    let cancelled = false;
    ApiClient.v26GetUserOnboarding({ userId: currentUser.id, userRole: role })
      .then((prog) => {
        if (cancelled || !prog) return;
        if (prog.currentStep && prog.currentStep >= 1 && prog.currentStep <= 7) {
          setStep(prog.currentStep);
        }
        saveOnboardingDraft({
          step: prog.currentStep || 1,
          language: (prog.selectedLanguage as EconexLanguageCode) || language,
          accountType: prog.accountType || onboardingDraft.accountType,
          fullName: prog.fullName || currentUser.name || onboardingDraft.fullName,
          phone: prog.phone || currentUser.phone || onboardingDraft.phone,
          email: prog.email || currentUser.email || onboardingDraft.email,
          district: prog.district || currentUser.district || onboardingDraft.district,
          interests: Array.isArray(prog.interests) && prog.interests.length > 0 ? prog.interests : onboardingDraft.interests,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUser?.id]);

  const syncProgressToServer = async (targetStep: number, completed = false) => {
    if (!currentUser?.id) return;
    await ApiClient.v26UpdateUserOnboarding(
      {
        currentStep: targetStep,
        selectedLanguage: language,
        countryCode: activeCountry,
        accountType: onboardingDraft.accountType,
        fullName: onboardingDraft.fullName || currentUser.name,
        phone: onboardingDraft.phone || currentUser.phone,
        email: onboardingDraft.email || currentUser.email,
        district: onboardingDraft.district || currentUser.district,
        interests: onboardingDraft.interests,
        consentAccepted: true,
        completed,
      },
      { userId: currentUser.id, userRole: role, countryCode: activeCountry }
    ).catch(() => {});
  };

  const stepTitles = [
    'Welcome to ECONEX',
    'Choose Your Language',
    'How Will You Use ECONEX?',
    'Your Basic Information',
    'How Identity Verification Helps',
    'What Do You Need First?',
    'Your Home Screen Is Ready',
  ];

  const handleSaveForLater = async () => {
    saveOnboardingDraft({ step });
    await syncProgressToServer(step, false);
    setStatusMessage('Progress saved to your ECONEX account and this device. You can continue any time.');
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 800);
  };

  const toggleInterest = (id: string) => {
    const exists = onboardingDraft.interests.includes(id);
    const next = exists
      ? onboardingDraft.interests.filter((i) => i !== id)
      : [...onboardingDraft.interests, id];
    saveOnboardingDraft({ interests: next });
  };

  const handleFinishSetup = async () => {
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const selectedType = ACCOUNT_TYPE_OPTIONS.find((o) => o.id === onboardingDraft.accountType) || ACCOUNT_TYPE_OPTIONS[1];
      if (onboardingDraft.fullName.trim() && onboardingDraft.email.trim() && onboardingDraft.email.trim() !== currentUser?.email) {
        await register({
          name: onboardingDraft.fullName.trim(),
          email: onboardingDraft.email.trim(),
          phone: onboardingDraft.phone.trim() || '+256 700 000 000',
          role: selectedType.role,
          district: onboardingDraft.district || 'Mbale',
          organizationName: onboardingDraft.organizationName.trim() || undefined,
        }).catch(async () => {
          await switchRole(selectedType.role);
        });
      } else {
        await switchRole(selectedType.role);
      }
      await syncProgressToServer(7, true);
      completeOnboarding();
      saveOnboardingDraft({ step: 1 });
      onFinish?.();
      onClose();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Saved your preferences locally. Continuing to Home.');
      completeOnboarding();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccessibleDialog isOpen={isOpen} title="Guided Account Setup" onClose={onClose}>
      <div className="space-y-4">
        {statusMessage && (
          <div className="p-3 rounded-xl bg-[#181818] border border-[#D4AF37] text-xs text-[#D4AF37] flex items-center gap-2">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        <GuidedForm
          currentStep={step}
          totalSteps={7}
          stepTitle={stepTitles[step - 1]}
          helperText={
            step === 1
              ? 'ECONEX helps you buy, sell, check market prices, track deliveries, and manage payments in plain language.'
              : step === 2
                ? 'Pick the language you are most comfortable reading. You can change it later in Account settings.'
                : step === 3
                  ? 'Select the option that fits you best today. You can add a Business Profile later too.'
                  : step === 4
                    ? 'Enter your name and district. Leave email blank if you want to explore with your active session first.'
                    : step === 5
                      ? 'Verification builds trust with buyers and unlocks higher payment limits — you can verify right away or later.'
                      : step === 6
                        ? 'Select what matters most to you so we highlight those shortcuts on your Home screen.'
                        : 'Everything is set. Tap Finish to open your personalized ECONEX Home screen.'
          }
          onBack={step > 1 ? () => setStep((s) => s - 1) : undefined}
          onNext={
            step < 7
              ? () => {
                  const next = step + 1;
                  setStep(next);
                  saveOnboardingDraft({ step: next });
                  void syncProgressToServer(next, false);
                }
              : handleFinishSetup
          }
          nextLabel={step === 7 ? 'Go to My Home Screen' : 'Continue'}
          isSubmitting={submitting}
        >
          {step === 1 && (
            <div className="space-y-3 text-sm text-[#C0C0C0]">
              <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2">
                <div className="font-semibold text-[#F5F5F5]">Designed for everyone</div>
                <ul className="space-y-1.5 text-xs text-[#A0A0A0] list-disc list-inside">
                  <li>Clear buttons and step-by-step instructions</li>
                  <li>Works even on slow networks — drafts save on your device</li>
                  <li>Safe payment status tracking before and after money moves</li>
                </ul>
              </div>
              <div className="text-xs text-[#A0A0A0]">
                Currently signed in as <strong className="text-[#F5F5F5]">{currentUser?.name || 'Guest Farmer'}</strong>.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-2">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code as EconexLanguageCode);
                    saveOnboardingDraft({ language: l.code as EconexLanguageCode });
                  }}
                  className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    language === l.code
                      ? 'bg-[#181818] border-[#D4AF37] text-[#F5F5F5]'
                      : 'bg-[#121212] border-[#27272a] text-[#C0C0C0] hover:border-[#3f3f46]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{l.nativeName}</div>
                    <div className="text-xs text-[#A0A0A0]">{l.name} · {l.regionFocus}</div>
                  </div>
                  {language === l.code && <CheckCircle2 size={18} className="text-[#D4AF37]" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
              {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = onboardingDraft.accountType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => saveOnboardingDraft({ accountType: opt.id })}
                    className={`min-h-[52px] px-4 py-2.5 rounded-xl border text-left flex items-center gap-3 cursor-pointer ${
                      selected
                        ? 'bg-[#181818] border-[#D4AF37] text-[#F5F5F5]'
                        : 'bg-[#121212] border-[#27272a] text-[#C0C0C0] hover:border-[#3f3f46]'
                    }`}
                  >
                    <Icon size={20} className={selected ? 'text-[#D4AF37]' : 'text-[#A0A0A0]'} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{opt.title}</div>
                      <div className="text-xs text-[#A0A0A0]">{opt.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div>
                <label htmlFor="onb-name" className="block text-xs text-[#C0C0C0] mb-1">Full Name</label>
                <input
                  id="onb-name"
                  type="text"
                  placeholder="e.g. Sarah Namubiru"
                  value={onboardingDraft.fullName}
                  onChange={(e) => saveOnboardingDraft({ fullName: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="onb-phone" className="block text-xs text-[#C0C0C0] mb-1">Phone Number</label>
                  <input
                    id="onb-phone"
                    type="tel"
                    value={onboardingDraft.phone}
                    onChange={(e) => saveOnboardingDraft({ phone: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label htmlFor="onb-district" className="block text-xs text-[#C0C0C0] mb-1">District / City</label>
                  <input
                    id="onb-district"
                    type="text"
                    value={onboardingDraft.district}
                    onChange={(e) => saveOnboardingDraft({ district: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="onb-email" className="block text-xs text-[#C0C0C0] mb-1">Email (optional — only needed to create a brand new account)</label>
                <input
                  id="onb-email"
                  type="email"
                  placeholder="Optional email address"
                  value={onboardingDraft.email}
                  onChange={(e) => saveOnboardingDraft({ email: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm text-[#C0C0C0]">
              <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] flex items-start gap-3">
                <ShieldCheck size={22} className="text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="font-semibold text-[#F5F5F5]">Why verification builds trust</div>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">
                    Buyers prefer ordering from verified sellers because identity checks help stop fraud. You can start browsing right away and verify later from your Account tab or Help Centre.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#181818] border border-[#27272a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onboardingDraft.identityVerifiedLater}
                  onChange={(e) => saveOnboardingDraft({ identityVerifiedLater: e.target.checked })}
                  className="w-5 h-5 accent-[#D4AF37]"
                />
                <span className="text-xs text-[#F5F5F5]">Verify my identity later (let me explore now)</span>
              </label>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {INTEREST_OPTIONS.map((item) => {
                const active = onboardingDraft.interests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 cursor-pointer ${
                      active
                        ? 'bg-[#181818] border-[#D4AF37] text-[#F5F5F5]'
                        : 'bg-[#121212] border-[#27272a] text-[#A0A0A0]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 7 && (
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2 text-xs text-[#C0C0C0]">
              <div className="text-sm font-semibold text-[#F5F5F5]">Summary of your setup</div>
              <div>Account type: <strong className="text-[#F5F5F5]">{onboardingDraft.accountType}</strong></div>
              <div>Language: <strong className="text-[#F5F5F5]">{language.toUpperCase()}</strong></div>
              <div>District: <strong className="text-[#F5F5F5]">{onboardingDraft.district}</strong></div>
              <div>Selected shortcuts: <strong className="text-[#F5F5F5]">{onboardingDraft.interests.length}</strong></div>
            </div>
          )}
        </GuidedForm>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={handleSaveForLater}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#C0C0C0] hover:text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Save &amp; Continue Later</span>
          </button>
          <span className="text-[#A0A0A0]">Developed under VINEXSAH TECHNOLOGIES</span>
        </div>
      </div>
    </AccessibleDialog>
  );
};
