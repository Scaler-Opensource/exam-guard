import React, { ComponentPropsWithoutRef } from 'react';

export const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  e.preventDefault();
  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' });
  }
};

export const CustomLink = ({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) => {
  if (href?.startsWith('#')) {
    return (
      <a 
        href={href} 
        onClick={(e) => handleAnchorClick(e, href)}
        {...props}
      >
        {children}
      </a>
    );
  }
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props}
    >
      {children}
    </a>
  );
}; 