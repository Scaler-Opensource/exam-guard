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

// Function to create a slug from heading text (similar to rehype-slug)
export const generateSlug = (text: string) => {
  if (typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Keep hyphens along with alphanumeric and spaces
    .replace(/\s+/g, '-');
};

// Extract text content from children
const extractTextFromChildren = (children: React.ReactNode): string => {
  return React.Children.toArray(children)
    .map(child => {
      if (typeof child === 'string') return child;
      if (typeof child === 'object' && 'props' in child && child.props.children) {
        if (typeof child.props.children === 'string') return child.props.children;
        return extractTextFromChildren(child.props.children);
      }
      return '';
    })
    .join('');
};

// Individual heading components
export const H1 = ({ children, ...props }: ComponentPropsWithoutRef<'h1'>) => {
  const text = extractTextFromChildren(children);
  const id = generateSlug(text);
  return <h1 id={id} {...props}>{children}</h1>;
};

export const H2 = ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => {
  const text = extractTextFromChildren(children);
  const id = generateSlug(text);
  return <h2 id={id} {...props}>{children}</h2>;
};

export const H3 = ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => {
  const text = extractTextFromChildren(children);
  const id = generateSlug(text);
  return <h3 id={id} {...props}>{children}</h3>;
};

export const H4 = ({ children, ...props }: ComponentPropsWithoutRef<'h4'>) => {
  const text = extractTextFromChildren(children);
  const id = generateSlug(text);
  return <h4 id={id} {...props}>{children}</h4>;
};

export const H5 = ({ children, ...props }: ComponentPropsWithoutRef<'h5'>) => {
  const text = extractTextFromChildren(children);
  const id = generateSlug(text);
  return <h5 id={id} {...props}>{children}</h5>;
};

export const H6 = ({ children, ...props }: ComponentPropsWithoutRef<'h6'>) => {
  const text = extractTextFromChildren(children);
  const id = generateSlug(text);
  return <h6 id={id} {...props}>{children}</h6>;
};

// Component to handle raw HTML (similar to rehype-raw)
export const CustomHtml = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}; 
