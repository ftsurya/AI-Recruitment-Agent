import React from 'react';

interface ScrollFloatTextProps {
  textContent?: string;
  fontSize?: string;
  animationSpeed?: number;
  color?: string;
}

const ScrollFloatText: React.FC<ScrollFloatTextProps> = ({
  textContent = 'Scroll Down',
  fontSize = 'text-sm',
  animationSpeed = 3,
  color = 'text-slate-400',
}) => {
  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in animate-float"
      style={{ animationDuration: `${animationSpeed}s` }}
    >
      <span className={`${fontSize} ${color} font-medium tracking-widest uppercase`}>
        {textContent}
      </span>
      <svg
        className={`w-5 h-5 ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
};

export default ScrollFloatText;
