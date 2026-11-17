import { useState, useEffect, useRef } from 'react';
import { studentService } from '../services/studentService';

export function useJob(jobId, onComplete = null) {
  const [job, setJob] = useState(null);
  const [isPolling, setIsPolling] = useState(!!jobId);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const poll = async () => {
      try {
        const data = await studentService.getJob(jobId);
        setJob(data);

        if (data.status === 'done' || data.status === 'failed') {
          setIsPolling(false);
          if (timerRef.current) clearInterval(timerRef.current);
          if (data.status === 'done' && onComplete) {
            onComplete(data);
          }
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    };

    poll();
    timerRef.current = setInterval(poll, 1500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId]);

  return {
    job,
    status: job?.status || 'idle',
    progress: job?.progress_pct || 0,
    currentStep: job?.current_step || '',
    errorMessage: job?.error_message,
    isPolling,
  };
}
