import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import QuestionTable from '../components/QuestionTable';
import AnswerKeyEditor from '../components/AnswerKeyEditor';
import StudentTable from '../components/StudentTable';
import JobProgress from '../components/JobProgress';
import { examService } from '../services/examService';
import { studentService } from '../services/studentService';
import {
  Upload,
  Sparkles,
  FileText,
  KeyRound,
  Users,
  Download,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers,
  Lock,
  BarChart3,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamDetailPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answerKeys, setAnswerKeys] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab state: 'questions' | 'answerKey' | 'submissions' | 'overview'
  const [activeTab, setActiveTab] = useState('questions');

  // Active Job IDs for polling
  const [qpJobId, setQpJobId] = useState(null);
  const [akJobId, setAkJobId] = useState(null);
  const [subJobId, setSubJobId] = useState(null);
  const [lastUploadedSubId, setLastUploadedSubId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [examData, qData, akData, subData] = await Promise.all([
        examService.getExam(examId),
        examService.listQuestions(examId),
        examService.listAnswerKeys(examId),
        studentService.listSubmissions(examId),
      ]);
      setExam(examData);
      setQuestions(qData);
      setAnswerKeys(akData);
      setSubmissions(subData);
    } catch (err) {
      toast.error('Failed to load exam details');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatically activate the next sensible tab if previous steps are completed
  useEffect(() => {
    if (!isLoading) {
      if (submissions.length > 0) {
        setActiveTab('submissions');
      } else if (answerKeys.length > 0) {
        setActiveTab('answerKey');
      } else if (questions.length > 0) {
        setActiveTab('questions');
      }
    }
  }, [isLoading, submissions.length, answerKeys.length, questions.length]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleUploadQP = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Uploading question paper...', { id: 'qp-upload' });
      const res = await examService.uploadQuestionPaper(examId, file);
      toast.success('Question paper uploaded! GradeX extracting questions...', { id: 'qp-upload' });
      setQpJobId(res.job_id);
    } catch (err) {
      toast.error('Failed to upload question paper', { id: 'qp-upload' });
    }
  };

  const handleUploadAK = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Uploading answer key...', { id: 'ak-upload' });
      const res = await examService.uploadAnswerKey(examId, file);
      toast.success('Answer key uploaded! GradeX mapping solutions...', { id: 'ak-upload' });
      setAkJobId(res.job_id);
    } catch (err) {
      toast.error('Failed to upload answer key', { id: 'ak-upload' });
    }
  };

  const handleGenerateAK = async () => {
    try {
      toast.loading('Starting AI model answer generation...', { id: 'ak-gen' });
      const res = await examService.generateAnswerKey(examId);
      toast.success('Generating model answers with Gemini...', { id: 'ak-gen' });
      setAkJobId(res.job_id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate answer key', { id: 'ak-gen' });
    }
  };

  const handleUploadStudentSheet = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Uploading student answer sheet...', { id: 'sub-upload' });
      const res = await studentService.uploadSubmission(examId, file);
      toast.success('Uploaded! AI grading started...', { id: 'sub-upload' });
      setSubJobId(res.job_id);
      if (res.submission_id) setLastUploadedSubId(res.submission_id);
      loadData();
    } catch (err) {
      toast.error('Failed to upload student answer sheet', { id: 'sub-upload' });
    }
  };

  const handleBulkUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      toast.loading(`Uploading ${files.length} answer sheets...`, { id: 'bulk-upload' });
      const res = await studentService.bulkUploadSubmissions(examId, files);
      toast.success(res.message, { id: 'bulk-upload' });
      loadData();
    } catch (err) {
      toast.error('Bulk upload failed', { id: 'bulk-upload' });
    }
  };

  const handleUpdateQuestion = async (qId, updatedData) => {
    try {
      await examService.updateQuestion(examId, qId, updatedData);
      setQuestions((prev) => prev.map((q) => (q.id === qId ? updatedData : q)));
    } catch (err) {
      toast.error('Failed to update question');
    }
  };

  const handleAddQuestion = async () => {
    try {
      const newQ = await examService.createQuestion(examId, {
        question_no: `${questions.length + 1}`,
        question_text: 'New question',
        max_marks: 2.0,
        question_type: 'short',
        sub_parts: [],
      });
      setQuestions([...questions, newQ]);
      toast.success('Question added');
    } catch (err) {
      toast.error('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    try {
      await examService.deleteQuestion(examId, qId);
      setQuestions(questions.filter((q) => q.id !== qId));
      toast.success('Question deleted');
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const handleConfirmQuestions = async () => {
    try {
      await examService.confirmQuestions(examId);
      toast.success('Questions confirmed! Advancing to Step 2: Answer Key');
      loadData();
      setActiveTab('answerKey');
    } catch (err) {
      toast.error('Failed to confirm questions');
    }
  };

  const handleUpdateAnswerKey = async (akId, updatedData) => {
    try {
      await examService.updateAnswerKey(examId, akId, updatedData);
      setAnswerKeys((prev) => prev.map((ak) => (ak.id === akId ? updatedData : ak)));
    } catch (err) {
      toast.error('Failed to update answer key');
    }
  };

  const handleConfirmAnswerKey = async () => {
    try {
      await examService.confirmAnswerKey(examId);
      toast.success('Answer key confirmed! Ready for Step 3: Student Answer Sheets');
      loadData();
      setActiveTab('submissions');
    } catch (err) {
      toast.error('Failed to confirm answer key');
    }
  };

  const handleDeleteSubmission = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await studentService.deleteSubmission(subId);
      setSubmissions(submissions.filter((s) => s.id !== subId));
      toast.success('Submission deleted');
    } catch (err) {
      toast.error('Failed to delete submission');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-400 mt-4 font-medium tracking-wide">
            Loading GradeX Exam Workspace...
          </p>
        </div>
      </Layout>
    );
  }

  const questionsConfirmed = questions.length > 0;
  const keyConfirmed = answerKeys.length > 0;
  const submissionsPresent = submissions.length > 0;

  // Tab definitions with dynamic badges and progress indicators
  const tabs = [
    {
      id: 'questions',
      stepNumber: '01',
      label: 'Questions Blueprint',
      icon: FileText,
      badge: questions.length ? `${questions.length} Questions` : 'Pending',
      isCompleted: questionsConfirmed,
    },
    {
      id: 'answerKey',
      stepNumber: '02',
      label: 'Master Answer Key',
      icon: KeyRound,
      badge: answerKeys.length ? `${answerKeys.length} Keys` : 'Needs Key',
      isCompleted: keyConfirmed,
    },
    {
      id: 'submissions',
      stepNumber: '03',
      label: 'Student Sheets & Grading',
      icon: Users,
      badge: submissions.length ? `${submissions.length} Students` : 'Ready to Grade',
      isCompleted: submissionsPresent,
    },
    {
      id: 'overview',
      stepNumber: '04',
      label: 'Performance Insights',
      icon: BarChart3,
      badge: exam?.class_average ? `Avg: ${exam.class_average}` : 'Analytics',
      isCompleted: submissionsPresent,
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Navigation Breadcrumb */}
        <Link
          to="/dashboard"
          className="inline-flex items-center text-xs text-slate-400 hover:text-teal-400 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* ── Exam Hero Header Banner (Modern Emerald/Teal Obsidian) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/80 border border-teal-500/30 p-6 sm:p-8 shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold px-3 py-1 bg-teal-500/15 text-teal-300 rounded-full border border-teal-500/30">
                  {exam?.subject || 'Assessment'}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                  Class: {exam?.class_name || 'N/A'}
                </span>
                <span className="text-xs text-slate-400">
                  Max Marks: <strong className="text-teal-300">{exam?.total_marks || '—'}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {exam?.title}
              </h1>
              {exam?.description && (
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {exam.description}
                </p>
              )}

              {/* Status summary chips */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${questionsConfirmed ? 'bg-teal-400' : 'bg-slate-600'}`} />
                  <span>{questions.length} Questions</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${keyConfirmed ? 'bg-teal-400' : 'bg-slate-600'}`} />
                  <span>{answerKeys.length} Keys Configured</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${submissionsPresent ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>{submissions.length} Student Submissions</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-3">
              <a
                href={studentService.getExamCsvUrl(examId)}
                download
                className="inline-flex items-center px-4 py-2.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-teal-500/50 text-xs font-semibold rounded-xl shadow-sm transition-all group"
                title="Download class summary CSV"
              >
                <Download className="w-3.5 h-3.5 mr-2 text-teal-400 group-hover:scale-110 transition-transform" />
                Export CSV Report
              </a>
            </div>
          </div>
        </div>

        {/* ── REPOSITIONED TAB SYSTEM (Horizontal Workflow Navigator Rail) ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
                Evaluation Workflow Tabs
              </h2>
              <p className="text-xs text-slate-400">
                Navigate seamlessly between Question Blueprint, Master Key, and Student Sheets.
              </p>
            </div>
            {/* Step jump buttons */}
            <div className="hidden sm:flex items-center space-x-1 text-xs text-slate-400">
              <span className="font-mono text-teal-400 font-semibold">Stage:</span>
              <span className="text-slate-200 capitalize font-medium">{activeTab}</span>
            </div>
          </div>

          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center sm:items-start justify-between p-3.5 rounded-xl text-left transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/50 shadow-md shadow-teal-950/50'
                      : 'bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30'
                          : tab.isCompleted
                          ? 'bg-teal-950/80 text-teal-400 border border-teal-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.isCompleted && !isActive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {tab.stepNumber}
                        </span>
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isActive ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {tab.label}
                        </p>
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive
                            ? 'bg-teal-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="hidden sm:block">
                      <ChevronRight className="w-4 h-4 text-teal-400 mt-2" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB CONTENT 1: QUESTION PAPER BLUEPRINT ── */}
        {activeTab === 'questions' && (
          <div className="animate-fadeIn space-y-6">
            {/* Upload & Instructions Hero */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini Vision Question Extraction</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {questionsConfirmed
                      ? 'Question Paper Blueprint Configured'
                      : 'Upload & Extract Questions Automatically'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload your printed or scanned question paper PDF/Image. GradeX parses
                    every question number, question text, sub-parts, and maximum marks automatically.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <label className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer transition-all active:scale-95">
                    <Upload className="w-4 h-4 mr-2 stroke-[2.5]" />
                    {questionsConfirmed ? 'Re-upload Paper' : 'Select Question Paper (PDF / Image)'}
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleUploadQP}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {qpJobId && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <JobProgress
                    jobId={qpJobId}
                    title="Extracting Questions with Gemini Vision Pipeline"
                    onComplete={() => {
                      toast.success('Question extraction complete!');
                      loadData();
                    }}
                  />
                </div>
              )}
            </div>

            {/* Questions Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <QuestionTable
                questions={questions}
                onUpdateQuestion={handleUpdateQuestion}
                onAddQuestion={handleAddQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onConfirmAll={handleConfirmQuestions}
              />
            </div>

            {questionsConfirmed && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setActiveTab('answerKey')}
                  className="inline-flex items-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-xl transition-all shadow-md group"
                >
                  <span>Proceed to Step 2: Master Answer Key</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT 2: MASTER ANSWER KEY ── */}
        {activeTab === 'answerKey' && (
          <div className="animate-fadeIn space-y-6">
            {!questionsConfirmed && (
              <div className="flex items-center space-x-3 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <span>
                  Tip: Confirm your question blueprint first so GradeX can correctly index
                  and correlate questions with model answers.
                </span>
              </div>
            )}

            {/* Dual Options Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option A: Upload Key */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <KeyRound className="w-4 h-4" />
                    <span>Upload Official Key</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Upload Official Solutions Document
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have an official answer scheme or solutions key? Upload the document and
                    GradeX will parse and assign points to each question.
                  </p>
                </div>
                <label className="inline-flex items-center justify-center mt-6 px-4 py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-teal-500/40 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 mr-2 text-teal-400" />
                  Upload Solution Key (PDF / Image)
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleUploadAK}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option B: AI Generation */}
              <div className="bg-gradient-to-br from-slate-950 via-teal-950/40 to-slate-950 rounded-2xl border border-teal-500/40 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Automated AI Synthesis</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Synthesize Ideal Answers with AI
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No answer key available? GradeX will solve each question step-by-step
                    and construct a grading rubric with mandatory marking points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAK}
                  className="inline-flex items-center justify-center mt-6 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 mr-2 stroke-[2.5]" />
                  Generate AI Model Answers
                </button>
              </div>
            </div>

            {akJobId && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <JobProgress
                  jobId={akJobId}
                  title="Generating Answer Scheme with Gemini Reasoning Engine"
                  onComplete={() => {
                    toast.success('Answer key updated!');
                    loadData();
                  }}
                />
              </div>
            )}

            {/* Answer Key Editor */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <AnswerKeyEditor
                answerKeys={answerKeys}
                onUpdateKey={handleUpdateAnswerKey}
                onConfirmAll={handleConfirmAnswerKey}
              />
            </div>

            {keyConfirmed && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="inline-flex items-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-xl transition-all shadow-md group"
                >
                  <span>Proceed to Step 3: Student Answer Sheets</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT 3: STUDENT ANSWER SHEETS & GRADING ── */}
        {activeTab === 'submissions' && (
          <div className="animate-fadeIn space-y-6">
            {!keyConfirmed && (
              <div className="flex items-center space-x-3 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <span>
                  Tip: It is highly recommended to configure an Answer Key before uploading
                  student papers so GradeX can grade each question with step precision.
                </span>
              </div>
            )}

            {/* Upload Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Single PDF Upload */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Single Script</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Upload Single Student Sheet
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload a single student's handwritten PDF. GradeX Vision recognizes
                    handwriting, identifies student details, and performs step-by-step evaluation.
                  </p>
                </div>
                <label className="inline-flex items-center justify-center mt-6 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer transition-all active:scale-95">
                  <Upload className="w-4 h-4 mr-2 stroke-[2.5]" />
                  Select Student Sheet (PDF)
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUploadStudentSheet}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Bulk PDF Upload */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Layers className="w-4 h-4" />
                    <span>Batch Processing</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Bulk Upload Multiple Sheets
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload all exam answer sheets at once. All PDFs are queued, OCR processed,
                    and evaluated asynchronously in the background.
                  </p>
                </div>
                <label className="inline-flex items-center justify-center mt-6 px-4 py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-cyan-500/40 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors">
                  <Layers className="w-4 h-4 mr-2 text-cyan-400" />
                  Select Multiple PDFs
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {subJobId && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <JobProgress
                  jobId={subJobId}
                  title="GradeX Vision Grading Pipeline (Handwriting OCR + Rubrics)"
                  onComplete={() => {
                    toast.success('Evaluation complete! Opening review console...');
                    loadData();
                    if (lastUploadedSubId) {
                      setTimeout(() => {
                        navigate(`/exams/${examId}/students/${lastUploadedSubId}/review`);
                      }, 500);
                    }
                  }}
                />
              </div>
            )}

            {/* Student Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <StudentTable
                submissions={submissions}
                examId={examId}
                onDeleteSubmission={handleDeleteSubmission}
              />
            </div>
          </div>
        )}

        {/* ── TAB CONTENT 4: PERFORMANCE INSIGHTS ── */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Submissions
                </p>
                <h3 className="text-3xl font-extrabold text-white mt-2">
                  {submissions.length}
                </h3>
                <p className="text-[11px] text-teal-400 mt-1">Scripts submitted</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Class Average Score
                </p>
                <h3 className="text-3xl font-extrabold text-teal-300 mt-2">
                  {exam?.class_average ? `${exam.class_average}` : 'Pending'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Out of {exam?.total_marks || '—'}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Evaluated Ratio
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {submissions.filter((s) => s.submission_status === 'finalized' || s.submission_status === 'evaluated').length} / {submissions.length}
                </h3>
                <p className="text-[11px] text-emerald-400 mt-1">Completed reviews</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
              <BarChart3 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Full Analytics & Export Studio</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                Download comprehensive class grade-sheets, score distributions, and individual
                student feedback dossiers in standardized formats.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={studentService.getExamCsvUrl(examId)}
                  download
                  className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 mr-2 stroke-[2.5]" />
                  Download Class CSV Report
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
