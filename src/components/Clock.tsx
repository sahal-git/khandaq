import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-foreground">
      {format(time, 'hh:mm:ss a')}
    </div>
  );
};
