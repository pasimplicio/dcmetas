import { useMemo } from 'react';

const GaugeChart = ({ percent, size = 180, strokeWidth = 24 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle

  const strokeDashoffset = useMemo(() => {
    const validPercent = Math.min(Math.max(percent, 0), 200); 
    const visualPercent = Math.min(validPercent, 100);
    return circumference - (visualPercent / 100) * circumference;
  }, [percent, circumference]);

  const colorClass = 'text-[var(--brand-500)]';

  const isInvalid = isNaN(percent) || !isFinite(percent);
  const formattedPercent = isInvalid ? "0,00" : percent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 10 }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="absolute top-0 transform -rotate-180"
        style={{ clipPath: `inset(50% 0 0 0)` }}
      >
        {/* Background track - Lighter for visibility */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          className="text-white/80 dark:text-slate-700/50"
        />
        {/* Value track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      {/* Text in the middle */}
      <div className="absolute bottom-1 w-full flex flex-col items-center">
        <span className="text-2xl font-black heading-text text-brand-800 dark:text-brand-100 tabular-nums">
          {formattedPercent}%
        </span>
      </div>
    </div>
  );
};

export default GaugeChart;
