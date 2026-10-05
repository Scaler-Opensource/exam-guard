import { useEffect } from 'react';

export default function Loader({
  bgClassName = '',
  ringClassName = '',
  loaderClassName = '',
  size = 'md',
}: {
  bgClassName?: string;
  ringClassName?: string;
  loaderClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const sizeMap = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24',
  };

  const sizeClass = sizeMap[size];

  return (
    <div className={`flex items-center justify-center pr-4 ${bgClassName}`}>
      <div className={`relative ${sizeClass}`}>
        <div
          className={`absolute inset-0 rounded-full border-4 border-[#0080FF] opacity-25 ${ringClassName}`}
        ></div>
        <div
          className={`absolute inset-0 rounded-full border-4 border-transparent border-t-[#0080FF] animate-[spin_1s_linear_infinite] ${loaderClassName}`}
        ></div>
      </div>
    </div>
  );
}
