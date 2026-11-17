import { useState, useEffect, useMemo, useCallback } from 'react';
import { studentService } from '../services/studentService';
import toast from 'react-hot-toast';

export function computeGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export function useEvaluation(submissionId) {
  const [submission, setSubmission] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!submissionId) return;
    setIsLoading(true);
    try {
      const [subData, evalsData] = await Promise.all([
        studentService.getSubmission(submissionId),
        studentService.getEvaluations(submissionId),
      ]);
      setSubmission(subData);
      setEvaluations(evalsData);
    } catch (err) {
      toast.error('Failed to load evaluation data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-poll if submission is still being processed by Gemini
  useEffect(() => {
    if (submission && (submission.submission_status === 'processing' || submission.submission_status === 'uploaded')) {
      const interval = setInterval(async () => {
        try {
          const [subData, evalsData] = await Promise.all([
            studentService.getSubmission(submissionId),
            studentService.getEvaluations(submissionId),
          ]);
          setSubmission(subData);
          if (evalsData && evalsData.length > 0) {
            setEvaluations(evalsData);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [submission?.submission_status, submissionId]);

  // Live computed scores
  const scoreSummary = useMemo(() => {
    let totalAwarded = 0;
    let maxTotal = 0;

    evaluations.forEach((ev) => {
      const awarded = ev.final_marks !== null && ev.final_marks !== undefined ? Number(ev.final_marks) : 0;
      const maxM = ev.max_marks !== null && ev.max_marks !== undefined ? Number(ev.max_marks) : 0;
      totalAwarded += Math.max(0, Math.min(awarded, maxM));
      maxTotal += maxM;
    });

    const percentage = maxTotal > 0 ? Math.round((totalAwarded / maxTotal) * 1000) / 10 : 0;
    const grade = computeGrade(percentage);

    return {
      totalAwarded: Math.round(totalAwarded * 10) / 10,
      maxTotal: Math.round(maxTotal * 10) / 10,
      percentage,
      grade,
    };
  }, [evaluations]);

  // Override marks locally and on backend
  const overrideMarks = async (evalId, newMarks, comment = '') => {
    // Optimistic local update
    setEvaluations((prev) =>
      prev.map((e) =>
        e.id === evalId
          ? {
              ...e,
              final_marks: Math.max(0, Math.min(Number(newMarks), Number(e.max_marks))),
              teacher_comment: comment,
              is_overridden: true,
            }
          : e
      )
    );

    try {
      const updated = await studentService.overrideMarks(evalId, newMarks, comment);
      setEvaluations((prev) => prev.map((e) => (e.id === evalId ? updated : e)));
      // Also update submission status if draft
      if (submission && submission.submission_status === 'evaluated') {
        setSubmission((s) => ({ ...s, submission_status: 'reviewed' }));
      }
    } catch (err) {
      toast.error('Failed to save mark override');
      loadData(); // Revert on failure
    }
  };

  // Reset to AI marks
  const resetToAiMarks = async (evalId) => {
    const target = evaluations.find((e) => e.id === evalId);
    if (!target) return;
    await overrideMarks(evalId, target.ai_marks, '');
    toast.success('Reset to AI marks');
  };

  // Re-evaluate single question
  const reEvaluate = async (evalId) => {
    setIsSaving(true);
    try {
      const updated = await studentService.reEvaluateQuestion(evalId);
      setEvaluations((prev) => prev.map((e) => (e.id === evalId ? updated : e)));
      toast.success('Question re-evaluated');
    } catch (err) {
      toast.error('Re-evaluation failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Finalize submission
  const finalize = async () => {
    setIsSaving(true);
    try {
      await studentService.finalizeSubmission(submissionId);
      setSubmission((s) => ({ ...s, submission_status: 'finalized' }));
      toast.success('Evaluation finalized successfully!');
    } catch (err) {
      toast.error('Failed to finalize evaluation');
    } finally {
      setIsSaving(false);
    }
  };

  // Update header info (name, roll, class)
  const updateHeader = async (name, roll, className) => {
    try {
      const updated = await studentService.updateHeader(submissionId, {
        student_name: name,
        roll_number: roll,
        class_name: className,
      });
      setSubmission(updated);
      toast.success('Student header updated');
    } catch (err) {
      toast.error('Failed to update student header');
    }
  };

  return {
    submission,
    evaluations,
    isLoading,
    isSaving,
    scoreSummary,
    overrideMarks,
    resetToAiMarks,
    reEvaluate,
    finalize,
    updateHeader,
    reload: loadData,
  };
}
