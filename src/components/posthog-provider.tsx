'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const APP_NAME = 'cp-uploader';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    session_recording: {
      maskAllInputs: true,
    },
    loaded: (ph) => {
      ph.register({ app_name: APP_NAME });
    },
  });
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthog.capture('$pageview', { $current_url: url, app_name: APP_NAME });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
