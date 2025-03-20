import React, { Suspense } from 'react';
import Markdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';

const getMdComponent = (osName: string, browserName: string) => 
  React.lazy(() => 
    import(`@/assets/content/camera-share-guides/common.md`)
      .then(module => ({
        default: () => (
          <Markdown
            rehypePlugins={[rehypeSlug, rehypeRaw]}
            components={{
              a: ({ href, children, ...props }) => {
                // Handle internal links (anchor links) more cleanly
                if (href?.startsWith('#')) {
                  return (
                    <a 
                      href={href} 
                      onClick={(e) => {
                        e.preventDefault();
                        const targetId = href.substring(1);
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              }
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