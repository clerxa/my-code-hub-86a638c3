import { useState, useEffect } from 'react';

export const useScrollReveal = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Start revealing when user scrolls past 30% of viewport
      const revealStart = windowHeight * 0.3;
      
      // Extended transition zone for smoother effect (2x viewport height)
      const transitionZone = windowHeight * 2;
      
      // Calculate progress from 0 to 1 with easing
      const rawProgress = Math.min(Math.max((scrollY - revealStart) / transitionZone, 0), 1);
      
      // Apply easing function for smoother transition
      const easedProgress = rawProgress < 0.5
        ? 2 * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;
      
      setScrollProgress(easedProgress);
      setIsRevealing(scrollY > revealStart);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollProgress, isRevealing };
};
