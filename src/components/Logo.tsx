import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
}

// Reusable Logo component using D2D_logo.png with 200% scaling
const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  showText = false,
  textClassName = "",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo with 200% scale with margin (transparent, no background) */}
      <div
        className={`${sizeClasses[size]} flex items-center justify-center flex-shrink-0 mx-2`}
      >
        <img
          src="/D2D_logo.png"
          alt="Degree2Destiny Logo"
          className="w-full h-full object-contain transform scale-120 transition-transform duration-200"
          loading="eager"
          onError={(e) => {
            // Fallback to gradient div if logo fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const fallback = parent.querySelector(
                ".logo-fallback",
              ) as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }
          }}
        />
        <div className="logo-fallback w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center hidden absolute inset-0">
          <span className="text-white font-bold text-xs">D2D</span>
        </div>
      </div>
      {showText && (
        <h1 className={`text-xl font-bold whitespace-nowrap ${textClassName}`}>
          Degree2Destiny
        </h1>
      )}
    </div>
  );
};

export default Logo;
