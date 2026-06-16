import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

import { formatCurrency } from '../lib/utils';

interface GoalProgressProps {
  current: number;
  target: number;
  color?: string;
  className?: string;
  showDetails?: boolean;
  showValues?: boolean;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ 
  current, 
  target, 
  color = 'black', 
  className,
  showDetails = true,
  showValues = false
}) => {
  const progress = target > 0 ? (current / target) * 100 : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const isCompleted = clampedProgress >= 100;
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Trigger celebration only once when it hits 100%
  useEffect(() => {
    if (isCompleted && !hasCelebrated) {
      setHasCelebrated(true);
    }
  }, [isCompleted, hasCelebrated]);

  // Animated number logic
  const springProgress = useSpring(0, { stiffness: 40, damping: 20 });
  const displayProgress = useTransform(springProgress, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    springProgress.set(clampedProgress);
  }, [clampedProgress, springProgress]);

  useEffect(() => {
    return displayProgress.on('change', (latest) => {
      setDisplayValue(latest);
    });
  }, [displayProgress]);

  return (
    <div className={cn("space-y-4 w-full relative", className)}>
      <AnimatePresence>
        {isCompleted && (
          <div className="absolute inset-x-0 -top-8 flex justify-center pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1.2, 0.5],
                  x: (i - 5.5) * 15,
                  y: -40 - (Math.random() * 40)
                }}
                transition={{ 
                  duration: 2, 
                  delay: 1.5 + (i * 0.05),
                  ease: "easeOut"
                }}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {showDetails && (
        <div className="flex items-end justify-between mb-1">
          <div className="flex items-center gap-2">
            <motion.span 
              animate={isCompleted ? { scale: [1, 1.1, 1], color: '#10b981' } : {}}
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                isCompleted ? "text-emerald-500" : "text-black italic"
              )}
            >
              {isCompleted ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Target Realized
                </span>
              ) : (
                `${displayValue}% Realization`
              )}
            </motion.span>
          </div>
          <span className="text-[9px] lg:text-[10px] font-mono text-brand-gray-400 uppercase font-bold tracking-widest tabular-nums">
            {showValues ? `${formatCurrency(current)} / ${formatCurrency(target)}` : `${clampedProgress.toFixed(1)}% Threshold`}
          </span>
        </div>
      )}

      <motion.div 
        animate={isCompleted ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.5 }}
        className="relative h-3 lg:h-4 w-full overflow-hidden rounded-full bg-brand-gray-50 border border-brand-gray-100 p-0.5 lg:p-1"
      >
        {/* Background shimmer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isCompleted ? 0 : 0.1,
            translateX: ['-100%', '200%'],
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full"
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Progress Bar Body */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: `${clampedProgress}%`,
            backgroundColor: isCompleted ? '#10b981' : color
          }}
          className="relative h-full rounded-full shadow-[0_0_20px_rgba(0,0,0,0.1)] overflow-hidden"
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Shimmer Effect for the progress itself */}
          {!isCompleted && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              animate={{
                translateX: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* Sparkle at the end of progress */}
          {clampedProgress > 0 && !isCompleted && (
            <motion.div 
              className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-sm"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>

      {isCompleted && showDetails && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1.6 }}
          className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 self-start px-3 py-1 rounded-full border border-emerald-100 shadow-sm"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Protocol Succeeded
        </motion.div>
      )}
    </div>
  );
};

export default GoalProgress;
