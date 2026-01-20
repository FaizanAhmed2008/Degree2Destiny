import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textClassName?: string;
}

// Reusable Logo component using D2D_logo.png
const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = false,
  textClassName = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex items-center justify-center transition-transform duration-200 relative bg-white/20 dark:bg-gray-900/80 backdrop-blur-sm p-1.5 shadow-sm`}>
        <img 
          src="/D2D_logo.png" 
          alt="Degree2Destiny Logo" 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to gradient div if logo fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }
          }}
        />
        <div className="logo-fallback w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center hidden absolute inset-0">
          <span className="text-white font-bold text-xs">D2D</span>
        </div>
      </div>
      {showText && (
        <h1 className={`text-xl font-bold ${textClassName}`}>Degree2Destiny</h1>
      )}
    </div>
  );
};

export default Logo;
