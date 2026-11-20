/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Optional Voice-Assisted Interaction Layer
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { AccessibleDialog } from './CorePrimitives.tsx';

export type VoiceCommandIntent =
  | 'MARKET_PRICES'
  | 'SELL_PRODUCT'
  | 'FIND_BUYERS'
  | 'MY_ORDERS'
  | 'CHECK_PAYMENT'
  | 'REGISTER_BUSINESS'
  | 'FIND_TRANSPORT';

interface Props {
  onNavigateIntent: (intent: VoiceCommandIntent, spokenText?: string) => void;
  summaryToSpeak?: string;
}

export const EXAMPLE_VOICE_COMMANDS: { phrase: string; intent: VoiceCommandIntent }[] = [
  { phrase: "Show me today's market prices", intent: 'MARKET_PRICES' },
  { phrase: 'I want to sell my maize', intent: 'SELL_PRODUCT' },
  { phrase: 'Find buyers near me', intent: 'FIND_BUYERS' },
  { phrase: 'Show my orders', intent: 'MY_ORDERS' },
  { phrase: 'Has my customer paid?', intent: 'CHECK_PAYMENT' },
  { phrase: 'Help me register my business', intent: 'REGISTER_BUSINESS' },
  { phrase: 'Find transport for my products', intent: 'FIND_TRANSPORT' },
];

export function matchVoiceCommand(transcript: string): VoiceCommandIntent | null {
  const s = transcript.toLowerCase();
  if (s.includes('paid') || s.includes('payment') || s.includes('money')) return 'CHECK_PAYMENT';
  if (s.includes('price') || s.includes('market price')) return 'MARKET_PRICES';
  if (s.includes('sell') || s.includes('maize') || s.includes('coffee') || s.includes('list')) return 'SELL_PRODUCT';
  if (s.includes('buyer') || s.includes('customer')) return 'FIND_BUYERS';
  if (s.includes('order')) return 'MY_ORDERS';
  if (s.includes('register') || s.includes('business')) return 'REGISTER_BUSINESS';
  if (s.includes('transport') || s.includes('truck') || s.includes('delivery')) return 'FIND_TRANSPORT';
  return null;
}

export function speakTextOutLoud(text: string, langCode: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode === 'sw' ? 'sw-KE' : 'en-UG';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export const VoiceHelpButton: React.FC<Props> = ({ onNavigateIntent, summaryToSpeak }) => {
  const { language } = useExperience();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<{ intent: VoiceCommandIntent; phrase: string } | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const hasBrowserStt =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const hasTts = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const startListening = () => {
    setVoiceNote(null);
    if (!hasBrowserStt) {
      setVoiceNote(
        'Live microphone voice recognition requires an online browser Speech API and is not available offline on this browser. Please tap a voice command example below or type what you need.'
      );
      return;
    }
    try {
      const Rec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new Rec();
      rec.lang = language === 'sw' ? 'sw-KE' : 'en-UG';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setListening(true);
      rec.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript || '';
        setTranscript(spoken);
        setListening(false);
        const intent = matchVoiceCommand(spoken);
        if (intent) {
          setPendingConfirm({ intent, phrase: spoken });
        } else {
          setVoiceNote(`Heard "${spoken}". Choose a matching action below so we go to the right place.`);
        }
      };
      rec.onerror = () => {
        setListening(false);
        setVoiceNote('Microphone could not start or permission was declined. You can tap any action below instead.');
      };
      rec.onend = () => setListening(false);
      rec.start();
    } catch {
      setListening(false);
      setVoiceNote('Microphone unavailable. Please tap an option below.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
      >
        <Mic size={17} className="text-[#D4AF37]" aria-hidden="true" />
        <span>Voice Assistant</span>
      </button>

      <AccessibleDialog isOpen={open} title="Voice-Assisted Navigation & Audio Help" onClose={() => setOpen(false)}>
        <div className="space-y-4 text-sm text-[#C0C0C0]">
          <p className="text-[#F5F5F5]">
            Speak what you want to do, listen to page instructions, or tap one of the quick voice commands below.
          </p>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1">
            <div className="font-semibold text-[#F5F5F5]">Microphone & Safety Notice</div>
            <p className="text-[#A0A0A0]">
              Microphone audio is processed only when you tap Listen. Voice requires browser online speech support (not available offline). Money transfers, withdrawals, and contract signatures can never run from voice alone — you will always see a confirmation screen first.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startListening}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold flex items-center gap-2 cursor-pointer"
            >
              {listening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
              <span>{listening ? 'Listening...' : 'Speak Command'}</span>
            </button>

            {summaryToSpeak && (
              <button
                type="button"
                onClick={() => {
                  const ok = speakTextOutLoud(summaryToSpeak, language);
                  if (!ok) setVoiceNote('Text-to-speech is not supported on this browser.');
                }}
                disabled={!hasTts}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Volume2 size={18} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Read Page Aloud</span>
              </button>
            )}
          </div>

          {voiceNote && (
            <div className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#D4AF37] flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{voiceNote}</span>
            </div>
          )}

          {transcript && (
            <div className="text-xs text-[#A0A0A0]">
              You said: <strong className="text-[#F5F5F5]">"{transcript}"</strong>
            </div>
          )}

          {pendingConfirm && (
            <div className="p-4 rounded-xl bg-[#181818] border border-[#D4AF37] space-y-3">
              <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Confirm Voice Action</span>
              </div>
              <p className="text-xs text-[#C0C0C0]">
                Open <strong className="text-[#F5F5F5]">{pendingConfirm.intent.replace('_', ' ')}</strong> from command "{pendingConfirm.phrase}"?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateIntent(pendingConfirm.intent, pendingConfirm.phrase);
                    setPendingConfirm(null);
                    setOpen(false);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
                >
                  Confirm & Open
                </button>
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#121212] border border-[#27272a] text-[#C0C0C0] text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="text-xs font-medium text-[#A0A0A0]">Try tapping one of these common requests:</div>
            <div className="grid grid-cols-1 gap-2">
              {EXAMPLE_VOICE_COMMANDS.map((cmd) => (
                <button
                  key={cmd.intent}
                  type="button"
                  onClick={() => setPendingConfirm({ intent: cmd.intent, phrase: cmd.phrase })}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left text-sm text-[#F5F5F5] cursor-pointer"
                >
                  "{cmd.phrase}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </AccessibleDialog>
    </>
  );
};
