import React, { Suspense } from 'react';
import Markdown from 'react-markdown';
import { CustomLink, H1, H2, H3, H4, H5, H6 } from '@/ui/CustomMarkdownComponents';

const getMdComponent = (osName: string, browserName: string) => 
  React.lazy(() => 
    import(`@/assets/content/camera-share-guides/common.md`)
      .then(module => ({
        default: () => (
          <Markdown
            components={{
              a: CustomLink,
              h1: H1,
              h2: H2,
              h3: H3,
              h4: H4,
              h5: H5,
              h6: H6,
              img: (props) => <img alt={props.alt || ''} {...props} />
            }}
          >
            {module.default}
          </Markdown>
        )
      }))
  );

interface CameraShareGuideProps {
  browserName: string;
  osName: string;
}

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

export default function CameraShareGuide({
  browserName,
  osName,
}: CameraShareGuideProps) {
  const Guide = getMdComponent(osName, browserName);

  return (
    <div className="prose prose-sm max-w-none markdown-content">
      <Suspense fallback={<SkeletonLoading />}>
        <Guide />
      </Suspense>
    </div>
  );
};