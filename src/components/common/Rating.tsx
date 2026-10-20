import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxStars = 5,
  size = 'sm',
  showCount = false,
  count,
  interactive = false,
  onChange,
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: maxStars }).map((_, index) => {
          const filled = index < Math.floor(rating);
          const half = !filled && index < rating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(index + 1)}
              className={`${interactive ? 'cursor-pointer hover:scale-125 transition-transform' : 'cursor-default'} focus:outline-none`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : half
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-200 fill-slate-100'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs font-semibold text-slate-700 ml-0.5">
          {rating.toFixed(1)} {count !== undefined && <span className="text-slate-400 font-normal">({count})</span>}
        </span>
      )}
    </div>
  );
};
