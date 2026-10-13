import React from 'react';
import {
  AlertTriangle, CircleCheck, CloudOff, Lightbulb, Loader2,
} from 'lucide-react';

// The design's illustrations and positioning clip are served by the proctoring web app, which
// shares its origin with the API (baseUrl), so they stay out of the proctor.js bundle.
export const identityMedia = (baseUrl: string, name: string): string => `${baseUrl}/identity-media/${name}`;

// The wizard's card: on errors the pink reason strip is pinned to its top, as on screen share.
export const IdentityCard = ({ banner, children }: { banner?: string; children: React.ReactNode }) => (
  <div className='w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0px_2px_14px_0px_rgba(16,24,40,0.05)]'>
    {banner && (
      <div className='flex min-h-[4.6rem] items-center justify-center gap-2 bg-red-100 px-6 py-3 text-center text-base font-semibold text-red-500'>
        <AlertTriangle className='h-[1.8rem] w-[1.8rem] shrink-0' />
        {banner}
      </div>
    )}
    <div className='px-10 pb-10 pt-8'>{children}</div>
  </div>
);

export const TwoColumns = ({ children }: { children: React.ReactNode }) => (
  <div className='grid grid-cols-2 gap-6'>{children}</div>
);

// Illustration on the left, copy on the right: consent, blocked and service error.
export const Split = ({ children }: { children: React.ReactNode }) => (
  <div className='grid grid-cols-[34rem_1fr] items-center gap-12'>{children}</div>
);

type Ring = 'searching' | 'framed' | 'done' | 'failed';
const RING: Record<Ring, string> = {
  searching: 'border-dashed border-gray-400',
  framed: 'border-scaler-500',
  done: 'border-green-600',
  failed: 'border-red-500',
};

// The camera box: dark media area, the face oval with the outside dimmed, and its labels.
export const CameraFrame = ({
  ring, pill, pillTone = 'neutral', live = false, children,
}: {
  ring: Ring; pill?: string; pillTone?: 'neutral' | 'error'; live?: boolean; children?: React.ReactNode;
}) => (
  <div className='relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#141A24]'>
    {children}
    <div
      className={`pointer-events-none absolute left-1/2 top-[47%] aspect-[3/4] h-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 shadow-[0_0_0_9999px_rgba(11,27,58,0.55)] ${RING[ring]}`}
    />
    {live && (
      <span className='absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[rgba(11,27,58,0.82)] px-3 py-1 text-xs font-bold text-white'>
        <span className='h-2 w-2 rounded-full bg-green-500' />
        Your camera
      </span>
    )}
    {pill && (
      <span className={`absolute bottom-4 left-1/2 max-w-[88%] -translate-x-1/2 rounded-full px-4 py-2 text-center text-sm font-bold text-white ${pillTone === 'error' ? 'bg-red-500/90' : 'bg-[rgba(11,27,58,0.82)]'}`}>
        {pill}
      </span>
    )}
  </div>
);

export const IdlePanel = ({ spinner = true, children }: { spinner?: boolean; children: React.ReactNode }) => (
  <div className='flex h-full min-h-[15rem] flex-col items-center justify-center gap-4 rounded-2xl bg-gray-100 p-6 text-center'>
    {spinner && <Loader2 className='h-10 w-10 animate-spin text-scaler-500' />}
    <span className='max-w-[34ch] text-base text-base-500'>{children}</span>
  </div>
);

export const CheckRows = ({ rows }: { rows: string[] }) => (
  <ul className='mt-5 overflow-hidden rounded-xl border border-gray-200'>
    {rows.map((row) => (
      <li key={row} className='flex min-h-[7.2rem] items-center gap-5 border-b border-gray-200 px-6 py-3 last:border-b-0'>
        <CircleCheck className='h-[2.2rem] w-[2.2rem] shrink-0 text-white fill-green-600' />
        <span className='text-base text-base-700'>{row}</span>
      </li>
    ))}
  </ul>
);

export const PanelHeading = ({
  title, sub, done = false,
}: { title: string; sub?: string; done?: boolean }) => (
  <div className='flex items-start gap-3'>
    {done && <CircleCheck className='mt-1 h-[2rem] w-[2rem] shrink-0 text-white fill-green-600' />}
    <div>
      <h3 className='text-xl font-bold text-base-700'>{title}</h3>
      {sub && <p className='mt-2 text-base leading-relaxed text-base-500'>{sub}</p>}
    </div>
  </div>
);

// A grey label/value row, e.g. "Attempts used 0" or the support reference.
export const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className='mt-6 flex items-center justify-between rounded-md bg-gray-50 px-5 py-3 text-base text-base-500'>
    <span>{label}</span>
    {value != null && <span className='font-bold text-base-700'>{value}</span>}
  </div>
);

export const GuideLink = ({ onOpen }: { onOpen: () => void }) => (
  <p className='mt-4 flex items-center gap-2 text-base font-bold text-base-700'>
    <Lightbulb className='h-[1.8rem] w-[1.8rem] shrink-0' />
    <button type='button' className='text-scaler-500 underline underline-offset-2' onClick={onOpen}>
      See how the face verification works
    </button>
  </p>
);

export const FixBox = ({ tip, onOpenGuide }: { tip: string; onOpenGuide: () => void }) => (
  <div className='mt-5 rounded-md bg-gray-50 px-5 py-4 text-base leading-relaxed text-base-700'>
    <b>What to do</b>
    <br />
    {tip}
    <GuideLink onOpen={onOpenGuide} />
  </div>
);

// The framed face illustration, tinted and badged by state.
export const IllustrationPanel = ({ tone, baseUrl }: { tone: 'info' | 'error' | 'neutral'; baseUrl: string }) => {
  const background = { info: 'bg-scaler-100', error: 'bg-red-100', neutral: 'bg-gray-100' }[tone];
  return (
    <div className={`flex items-center justify-center rounded-lg p-8 ${background}`}>
      <div className='relative rounded-lg bg-white p-4'>
        <img src={identityMedia(baseUrl, 'illus-hero.jpg')} alt='' className='block h-auto w-full max-w-[26rem] rounded-md' />
        {tone === 'error' && <AlertTriangle className='absolute bottom-3 right-3 h-12 w-12 rounded-md bg-white p-1 text-red-500' />}
        {tone === 'neutral' && <CloudOff className='absolute bottom-3 right-3 h-12 w-12 rounded-md bg-white p-1 text-gray-500' />}
      </div>
    </div>
  );
};

// Production's help line, shared by every wizard step.
export const HelpLine = ({ onOpen }: { onOpen: () => void }) => (
  <p className='mt-6 text-center text-sm font-semibold text-base-500'>
    <Lightbulb className='mb-1 mr-2 inline-block h-6 w-6' />
    Need help?{' '}
    <button type='button' className='text-scaler-500 underline' onClick={onOpen}>Click to view</button>
    {' '}face verification guide
  </p>
);
