'use client';

import { useEffect } from 'react';
import {
  trackSpaBookingWithReportView,
  trackSpaResultsView,
  trackSpaWrittenCheckoutView,
} from '@/lib/path-assessment/path-assessment-analytics';

export function SpaResultsViewTracker() {
  useEffect(() => {
    trackSpaResultsView();
  }, []);
  return null;
}

export function SpaWrittenCheckoutViewTracker() {
  useEffect(() => {
    trackSpaWrittenCheckoutView();
  }, []);
  return null;
}

export function SpaBookingWithReportTracker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (enabled) trackSpaBookingWithReportView();
  }, [enabled]);
  return null;
}
