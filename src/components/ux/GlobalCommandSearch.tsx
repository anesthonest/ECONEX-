/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V18.0 - Accessible Role- & Permission-Scoped Global Command Search (Ctrl+K / Cmd+K)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  X,
  ArrowRight,
  ShieldAlert,
  Layers,
  Store,
  Sparkles,
  Receipt,
  HelpCircle,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { searchNavRegistry } from '../../navigation/navigationRegistry.ts';
import { ApiClient } from '../../services/apiClient.ts';
import type { V18SearchResult } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

const KIND_LABELS: Record<V18SearchResult['kind'], string> = {
  MODULE: 'Workspaces & Modules',
  LISTING: 'Marketplace Listings',
  OPPORTUNITY: 'Opportunities & Buyer Requests',
  ORDER: 'Orders & Transactions',
  SUPPORT_CASE: 'Support Cases',
  PARTICIPANT: 'Verified Participants',
  ORGANIZATION: 'Organizations & Cooperatives',
};

function getKindIcon(kind: V18SearchResult['kind']) {
  switch (kind) {
    case 'MODULE':
      return Layers;
    case 'LISTING':
      return Store;
    case 'OPPORTUNITY':
      return Sparkles;
    case 'ORDER':
      return Receipt;
    case 'SUPPORT_CASE':
      return HelpCircle;
    case 'PARTICIPANT':
      return UserCheck;
    case 'ORGANIZATION':
      return Building2;
  }
}

export const GlobalCommandSearch: React.FC<Props> = ({ isOpen, onClose, onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const { mode } = useExperience();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<V18SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingConfirm, setPendingConfirm] = useState<V18SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPendingConfirm(null);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const localModules: V18SearchResult[] = searchNavRegistry(query, role, mode, 8).map((m) => ({
      id: `MOD-${m.id}`,
      kind: 'MODULE',
      title: m.label,
      subtitle: `${m.groupLabel} · ${m.description}`,
      route: m.route,
      tabId: m.id,
      badge: m.availability === 'SANDBOX_ONLY' ? 'Sandbox' : m.groupLabel,
    }));

    setResults(localModules);
    setActiveIndex(0);

    if (!query.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await ApiClient.v18Search(query.trim(), mode, {
          userId: currentUser?.id,
          userRole: role,
        });
        if (!cancelled && Array.isArray(res?.results)) {
          setResults(res.results);
          setActiveIndex(0);
        }
      } catch {
        // Keep local navigation matches as resilient fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, query, role, mode, currentUser?.id]);

  if (!isOpen) return null;

  const handleSelectResult = (item: V18SearchResult) => {
    if (item.requiresConfirmation) {
      setPendingConfirm(item);
      return;
    }
    onNavigateTab(item.tabId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (pendingConfirm) setPendingConfirm(null);
      else onClose();
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setActiveIndex((idx) => (idx + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setActiveIndex((idx) => (idx - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[activeIndex] && !pendingConfirm) {
      e.preventDefault();
      handleSelectResult(results[activeIndex]);
    }
  };

  const orderedKinds: V18SearchResult['kind'][] = [
    'MODULE',
    'LISTING',
    'OPPORTUNITY',
    'ORDER',
    'SUPPORT_CASE',
    'PARTICIPANT',
    'ORGANIZATION',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global ECONEX Search"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-20"
    >
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#27272a] bg-[#121212]">
          <Search size={18} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, produce listings, orders, support cases, cooperatives..."
            aria-label="Search modules and economic records"
            className="flex-1 bg-transparent text-sm sm:text-base text-[#F5F5F5] placeholder-[#71717a] focus:outline-none min-h-[40px]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close global search"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#27272a] text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {pendingConfirm ? (
          <div className="p-6 space-y-4 bg-[#0a0a0c]">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#181818] border border-[#D4AF37]/50 text-[#D4AF37]">
                <ShieldAlert size={20} aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#F5F5F5]">
                  Open Financial or Contractual Record
                </h3>
                <p className="text-sm text-[#A0A0A0]">
                  You are opening <strong className="text-[#F5F5F5]">{pendingConfirm.title}</strong> ({pendingConfirm.subtitle}).
                  Review status and authorization before confirming any settlement or dispatch action.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#121212] text-sm text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
              >
                Back to Search
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab(pendingConfirm.tabId);
                  onClose();
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm hover:bg-[#e5bf43] cursor-pointer"
              >
                Open Record
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-[62vh] overflow-y-auto p-3 space-y-4">
            <div className="flex items-center justify-between px-2 text-xs text-[#A0A0A0]">
              <span>
                Scoped to role <strong className="text-[#D4AF37]">{role}</strong> ({mode} view)
              </span>
              <span className="tabular-nums">
                {loading ? 'Searching...' : `${results.length} matches`}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#A0A0A0]">
                No authorized modules or records matched &quot;{query}&quot;.
              </div>
            ) : (
              orderedKinds.map((kind) => {
                const items = results.filter((r) => r.kind === kind);
                if (items.length === 0) return null;
                const Icon = getKindIcon(kind);
                return (
                  <div key={kind} className="space-y-1.5">
                    <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">
                      {KIND_LABELS[kind]}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const globalIdx = results.findIndex((r) => r.id === item.id);
                        const isSelected = globalIdx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            onClick={() => handleSelectResult(item)}
                            className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#181818] border-[#D4AF37]/60 text-[#F5F5F5]'
                                : 'bg-[#121212] border-[#27272a] text-[#C0C0C0] hover:border-[#3f3f46]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon size={17} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[#F5F5F5] truncate">
                                  {item.title}
                                </div>
                                <div className="text-xs text-[#A0A0A0] truncate">
                                  {item.subtitle}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-mono text-[#A0A0A0] hidden sm:inline">
                                {item.route}
                              </span>
                              <ArrowRight size={14} className="text-[#D4AF37]" aria-hidden="true" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-[#27272a] bg-[#121212] flex items-center justify-between text-[11px] text-[#A0A0A0]">
          <span>Use Up/Down arrows and Enter to navigate, Esc to close.</span>
          <span className="font-mono">Ctrl+K / Cmd+K</span>
        </div>
      </div>
    </div>
  );
};
