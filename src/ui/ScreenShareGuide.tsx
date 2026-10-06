import { getBrowserInfo } from '@/utils/browser';
import { getOperatingSystemInfo } from '@/utils/osInfo';
import React, { Suspense, useMemo } from 'react';
import Markdown from 'react-markdown';

const getMdComponent = (osName: string, browserName: string) => 
  React.lazy(() => 
    import(`@/assets/content/screen-share-guides/${osName?.toLowerCase()}/${browserName?.toLowerCase()}.md`)
      .then(module => ({
        default: () => <Markdown>{module.default}</Markdown>
      }))
      .catch(() => 
        import('@/assets/content/screen-share-guides/common.md')
          .then(module => ({
            default: () => <Markdown>{module.default}</Markdown>
          }))
      )
  );

const SkeletonLoading = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-24 bg-slate-200 rounded w-3/4 my-16"></div>
    <div className="h-16 bg-slate-200 rounded w-1/2"></div>
    <div className="space-y-2 my-4">
      <div className="h-12 bg-slate-200 rounded"></div>
      <div className="h-12 bg-slate-200 rounded w-11/12"></div>
      <div className="h-12 bg-slate-200 rounded w-4/5"></div>
      <div className="h-12 bg-slate-200 rounded w-9/12"></div>
    </div>
  </div>
);

export default function ScreenShareGuide() {
  const browserInfo: any = useMemo(() => getBrowserInfo(), []);
  const osInfo: any = useMemo(() => getOperatingSystemInfo(), []);

  const Guide = getMdComponent(osInfo?.osName, browserInfo?.name);
  console.log(osInfo?.osName, browserInfo?.name, 'Os and browser');
  return (
    <div className="prose prose-sm max-w-none markdown-content">
      <Suspense fallback={<SkeletonLoading />}>
        <Guide />
      </Suspense>
    </div>
  );
};