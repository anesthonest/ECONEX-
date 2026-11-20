/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Centralized Human-Friendly Error Translator & Diagnostics
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export interface FriendlyErrorInfo {
  statusCode: number;
  title: string;
  userMessage: string;
  recoveryHint: string;
  technicalDetail: string;
}

export function translateHttpError(rawError: unknown, explicitStatus?: number): FriendlyErrorInfo {
  const rawMsg = rawError instanceof Error ? rawError.message : String(rawError || '');
  const lower = rawMsg.toLowerCase();

  let status = explicitStatus || 0;
  if (!status) {
    if (lower.includes('403') || lower.includes('forbidden') || lower.includes('permission') || lower.includes('admin') || lower.includes('tenant_isolation')) {
      status = 403;
    } else if (lower.includes('401') || lower.includes('authentication') || lower.includes('expired') || lower.includes('unauthorized')) {
      status = 401;
    } else if (lower.includes('404') || lower.includes('not found')) {
      status = 404;
    } else if (lower.includes('409') || lower.includes('conflict') || lower.includes('cannot transition')) {
      status = 409;
    } else if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many')) {
      status = 429;
    } else if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('offline')) {
      status = 0;
    } else {
      status = 500;
    }
  }

  if (status === 403) {
    return {
      statusCode: 403,
      title: 'Access Restricted',
      userMessage: 'You do not have permission to access this section.',
      recoveryHint: 'Return to your Home screen or ask your organization administrator if you need access.',
      technicalDetail: rawMsg || 'HTTP 403 Forbidden / Authorization check declined this role.',
    };
  }

  if (status === 401) {
    return {
      statusCode: 401,
      title: 'Sign-In Required',
      userMessage: 'Your session has expired. Please sign in again.',
      recoveryHint: 'Tap Sign In to continue safely without losing saved drafts.',
      technicalDetail: rawMsg || 'HTTP 401 Authentication Required.',
    };
  }

  if (status === 404) {
    return {
      statusCode: 404,
      title: 'Item Not Found',
      userMessage: 'We could not find the page or record you requested.',
      recoveryHint: 'Go back to Home or search the Marketplace to find what you need.',
      technicalDetail: rawMsg || 'HTTP 404 Resource Not Found.',
    };
  }

  if (status === 409) {
    return {
      statusCode: 409,
      title: 'Action Cannot Be Completed Yet',
      userMessage: 'This step is waiting for a required check or previous step to finish.',
      recoveryHint: 'Review the item status or contact support if you believe a step is already complete.',
      technicalDetail: rawMsg || 'HTTP 409 Conflict / Lifecycle Precondition.',
    };
  }

  if (status === 429) {
    return {
      statusCode: 429,
      title: 'Please Wait a Moment',
      userMessage: 'Too many requests were sent too quickly.',
      recoveryHint: 'Wait a few seconds and try again.',
      technicalDetail: rawMsg || 'HTTP 429 Rate Limit Exceeded.',
    };
  }

  if (status === 0) {
    return {
      statusCode: 0,
      title: 'Connection Unavailable',
      userMessage: 'Your connection is unavailable. Some information may not be up to date.',
      recoveryHint: 'You can keep preparing drafts offline and sync them when your internet returns.',
      technicalDetail: rawMsg || 'Network unreachable / Offline mode.',
    };
  }

  return {
    statusCode: 500,
    title: 'Temporary Service Problem',
    userMessage: 'Something went wrong. Please try again or contact support.',
    recoveryHint: 'Retry your request, or open Help to send a support request.',
    technicalDetail: rawMsg || 'HTTP 500 Unexpected Server Error.',
  };
}

export function sanitizeCsvCell(val: unknown): string {
  const raw = String(val ?? '').replace(/"/g, '""');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe}"`;
}
