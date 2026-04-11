import React from 'react';
import { clsx } from 'clsx';

export default function Avatar({ src, fallback, className, size = "md" }) {
  const isUrl = typeof src === 'string' && (src.startsWith('http') || src.startsWith('https'));

  const sizeClasses = {
    xs: "w-8 h-8 text-xs rounded-lg",
    sm: "w-10 h-10 text-sm rounded-xl",
    md: "w-12 h-12 text-base rounded-2xl",
    lg: "w-16 h-16 text-2xl rounded-2xl",
    xl: "w-24 h-24 text-3xl rounded-3xl",
    "2xl": "w-32 h-32 text-4xl rounded-[40px]"
  };

  return (
    <div className={clsx(
      "bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg overflow-hidden shrink-0",
      sizeClasses[size],
      className
    )}>
      {isUrl ? (
        <img 
          src={src} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div className={clsx(
        "w-full h-full items-center justify-center",
        isUrl ? "hidden" : "flex"
      )}>
        {src && !isUrl ? src : fallback}
      </div>
    </div>
  );
}
