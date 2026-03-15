
import * as React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const containerSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className} select-none`}>
      <div className={`${containerSizes[size]} relative`}>
        <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-cuttie-purple rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-cuttie-pink mix-blend-multiply"></div>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
            <span className={`${textSizes[size]} font-display font-bold tracking-tight text-cuttie-charcoal`}>
            Cuttie
            </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
