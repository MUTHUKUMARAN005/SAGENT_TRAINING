import { useState, useEffect, useRef } from 'react';

export const useCountUp = (end, duration = 2000, start = 0, isVisible = true) => {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const startTime = useRef(null);

  useEffect(() => {
    if (!isVisible) return;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      countRef.current = Math.floor(start + (end - start) * eased);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTime.current = null;
    };
  }, [end, duration, start, isVisible]);

  return count;
};

export default useCountUp;