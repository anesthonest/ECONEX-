/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V29.0 - Zero-Broken-Image Media Component
 * Enforces lazy loading, descriptive alt text, Low-Data mode awareness, and clean visual fallback.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useExperience } from '../../context/ExperienceContext.tsx';

export interface EconexImageProps {
  src?: string;
  alt: string;
  fallbackLabel?: string;
  className?: string;
  containerClassName?: string;
  aspectClassName?: string;
  overlayGradient?: boolean;
  priority?: boolean;
}

export const EconexImage: React.FC<EconexImageProps> = ({
  src,
  alt,
  fallbackLabel,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  aspectClassName = 'aspect-[4/3]',
  overlayGradient = false,
  priority = false,
}) => {
  const { lowBandwidth } = useExperience();
  const [hasError, setHasError] = useState(false);

  const showFallback = lowBandwidth || !src || hasError;

  return (
    <div
      className={`relative overflow-hidden bg-[#181818] ${aspectClassName} ${containerClassName}`}
    >
      {showFallback ? (
        <div
          role="img"
          aria-label={alt}
          className="w-full h-full bg-gradient-to-br from-[#1a1a1f] via-[#121212] to-[#08080a] flex flex-col items-center justify-center gap-2 p-4 text-center border-b border-[#27272a]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-center text-[#D4AF37]">
            <ImageOff size={18} aria-hidden="true" />
          </div>
          <span className="text-xs font-medium text-[#C0C0C0] line-clamp-2 max-w-[220px]">
            {lowBandwidth ? 'Low-data mode active' : fallbackLabel || alt}
          </span>
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className={className}
          />
          {overlayGradient && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-[#050505]/40 to-transparent"
            />
          )}
        </>
      )}
    </div>
  );
};
