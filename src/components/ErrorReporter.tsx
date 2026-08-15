'use client';

import { useEffect } from 'react';
import { initErrorReporter } from '@/lib/errorReporter';

/** Mounted once in the root layout to activate global error capture. */
export default function ErrorReporter() {
  useEffect(() => {
    initErrorReporter();
  }, []);
  return null;
}