import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Check, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

type RefreshStatus = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'success';

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [status, setStatus] = useState<RefreshStatus>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const [showToast, setShowToast] = useState(false);
  
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isPullingRef = useRef(false);
  const isMouseDownRef = useRef(false);
  
  const THRESHOLD = 75; // px to pull before triggering refresh
  const MAX_PULL = 130;  // max px to drag down

  useEffect(() => {
    const scrollContainer = containerRef.current?.parentElement;
    if (!scrollContainer) return;

    // Use programmatic listener to allow preventDefault() when pulling down at scrollTop === 0
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartY.current = touch.pageY;
      touchStartX.current = touch.pageX;
      isPullingRef.current = false;
      
      // If we are already refreshing or simulating success, don't start a new pull
      if (status === 'refreshing' || status === 'success') return;
      
      const isAtTop = scrollContainer.scrollTop <= 0;
      if (isAtTop) {
        setStatus('idle');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (status === 'refreshing' || status === 'success') return;
      
      const isAtTop = scrollContainer.scrollTop <= 0;
      if (!isAtTop) return;
      
      const touch = e.touches[0];
      const deltaY = touch.pageY - touchStartY.current;
      const deltaX = touch.pageX - touchStartX.current;
      
      // If user drags horizontally more than vertically, do not lock into pulling
      if (!isPullingRef.current && Math.abs(deltaX) > Math.abs(deltaY)) {
        return;
      }

      if (deltaY > 0) {
        isPullingRef.current = true;
        
        // Prevent default native browser behavior (like page bounce)
        if (e.cancelable) {
          e.preventDefault();
        }
        
        // Logarithmic resistance formula for premium elastic feel
        const resistanceFactor = 0.5;
        const rawPull = deltaY * resistanceFactor;
        const currentPull = Math.min(rawPull, MAX_PULL);
        
        setPullDistance(currentPull);
        
        if (currentPull >= THRESHOLD) {
          setStatus('ready');
        } else {
          setStatus('pulling');
        }
      }
    };

    const handleTouchEnd = () => {
      isPullingRef.current = false;
      if (status === 'refreshing' || status === 'success') return;

      if (pullDistance >= THRESHOLD) {
        triggerRefresh();
      } else {
        resetPull();
      }
    };

    // Mouse events for flawless desktop preview testing
    const handleMouseDown = (e: MouseEvent) => {
      const isAtTop = scrollContainer.scrollTop <= 0;
      if (!isAtTop || status === 'refreshing' || status === 'success') return;
      
      isMouseDownRef.current = true;
      touchStartY.current = e.pageY;
      touchStartX.current = e.pageX;
      isPullingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      if (status === 'refreshing' || status === 'success') return;
      
      const isAtTop = scrollContainer.scrollTop <= 0;
      if (!isAtTop) return;

      const deltaY = e.pageY - touchStartY.current;
      const deltaX = e.pageX - touchStartX.current;

      if (!isPullingRef.current && Math.abs(deltaX) > Math.abs(deltaY)) {
        return;
      }

      if (deltaY > 0) {
        isPullingRef.current = true;
        
        // Prevent generic hover/select issues
        e.preventDefault();
        
        const resistanceFactor = 0.45;
        const rawPull = deltaY * resistanceFactor;
        const currentPull = Math.min(rawPull, MAX_PULL);
        
        setPullDistance(currentPull);
        
        if (currentPull >= THRESHOLD) {
          setStatus('ready');
        } else {
          setStatus('pulling');
        }
      }
    };

    const handleMouseUpOrLeave = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      isPullingRef.current = false;
      
      if (status === 'refreshing' || status === 'success') return;

      if (pullDistance >= THRESHOLD) {
        triggerRefresh();
      } else {
        resetPull();
      }
    };

    // Register touch listeners with { passive: false } to allow preventDefault
    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Register mouse listeners on the scroll container
    scrollContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUpOrLeave);

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
      
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUpOrLeave);
    };
  }, [pullDistance, status]);

  const triggerRefresh = async () => {
    setStatus('refreshing');
    setPullDistance(70); // Hold at comfortable spinning level

    try {
      // Execute the supplied refresh logic
      await onRefresh();
      
      // Keep state at success briefly to feel authentic
      setStatus('success');
      setPullDistance(70);
      
      setTimeout(() => {
        // Trigger toast confirmation
        setShowToast(true);
        resetPull();
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }, 800);

    } catch (err) {
      console.error("Refresh action failed: ", err);
      resetPull();
    }
  };

  const resetPull = () => {
    setStatus('idle');
    setPullDistance(0);
  };

  // Pull progress ratio (0 to 1)
  const progressRatio = Math.min(pullDistance / THRESHOLD, 1);
  const strokeDashoffset = 100 - (progressRatio * 100);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Pull indicator layer */}
      <div 
        className="absolute left-0 right-0 z-40 flex justify-center pointer-events-none transition-all duration-300"
        style={{ 
          height: `${pullDistance}px`,
          top: 0,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        <div 
          className="absolute flex items-center justify-center gap-2.5 rounded-full px-4 py-2 border-2 border-black/5 bg-white text-black shadow-xl backdrop-blur-md transition-shadow"
          style={{
            transform: `translateY(${Math.max(pullDistance - 50, 8)}px)`,
            minWidth: '120px'
          }}
        >
          {/* Circular progress loader */}
          {(status === 'pulling' || status === 'ready') && (
            <div className="relative h-6 w-6 shrink-0">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <circle 
                  className="text-brand-gray-100" 
                  strokeWidth="3.5" 
                  stroke="currentColor" 
                  fill="none" 
                  cx="18" 
                  cy="18" 
                  r="15" 
                />
                <circle 
                  className="text-black transition-all duration-75" 
                  strokeWidth="3.5" 
                  strokeDasharray="100" 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="none" 
                  cx="18" 
                  cy="18" 
                  r="15" 
                />
              </svg>
              <div 
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-black/50 transition-transform duration-300",
                  status === 'ready' && "rotate-180 text-black"
                )}
              >
                <ArrowDown className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Active Refreshing Spinner */}
          {status === 'refreshing' && (
            <RefreshCw className="h-4 w-4 animate-spin text-black" />
          )}

          {/* Success Checkmark Indicator */}
          {status === 'success' && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3.5 w-3.5" />
            </div>
          )}

          {/* Prompt Label text */}
          <span className="text-[10px] font-black uppercase tracking-widest text-black shrink-0">
            {status === 'pulling' && 'Pull to sync'}
            {status === 'ready' && 'Release to sync'}
            {status === 'refreshing' && 'App syncing...'}
            {status === 'success' && 'App synced'}
            {status === 'idle' && ''}
          </span>
        </div>
      </div>

      {/* Actual Content Wrapper with spring-like smooth movement */}
      <div 
        style={{
          transform: pullDistance !== 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isPullingRef.current ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
        }}
        className="w-full"
      >
        {children}
      </div>

      {/* Custom Bottom Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-brand-gray-100 bg-black p-4 text-white shadow-2xl xs:left-auto xs:right-8 xs:bottom-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Check className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">App Synced</h4>
                <p className="text-xs font-semibold text-brand-gray-300 mt-0.5">Wallets & reserves updated successfully.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
