import api from './api';

export const studentService = {
  async uploadSubmission(examId, file, studentName = '', rollNumber = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (studentName) formData.append('student_name', studentName);
    if (rollNumber) formData.append('roll_number', rollNumber);
    const res = await api.post(`/exams/${examId}/submissions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { submission_id, job_id, message }
  },

  async bulkUploadSubmissions(examId, files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await api.post(`/exams/${examId}/submissions/bulk-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async listSubmissions(examId) {
    const res = await api.get(`/exams/${examId}/submissions`);
    return res.data;
  },

  async getSubmission(submissionId) {
    const res = await api.get(`/submissions/${submissionId}`);
    return res.data;
  },

  async updateHeader(submissionId, data) {
    const res = await api.put(`/submissions/${submissionId}/header`, data);
    return res.data;
  },

  async deleteSubmission(submissionId) {
    await api.delete(`/submissions/${submissionId}`);
  },

  // Evaluations
  async getEvaluations(submissionId) {
    const res = await api.get(`/submissions/${submissionId}/evaluations`);
    return res.data;
  },

  async overrideMarks(evalId, finalMarks, teacherComment = '') {
    const res = await api.put(`/evaluations/${evalId}/marks`, {
      final_marks: finalMarks,
      teacher_comment: teacherComment,
    });
    return res.data;
  },

  async reEvaluateQuestion(evalId) {
    const res = await api.post(`/evaluations/${evalId}/re-evaluate`);
    return res.data;
  },

  async finalizeSubmission(submissionId) {
    const res = await api.post(`/submissions/${submissionId}/finalize`);
    return res.data;
  },

  async getAuditLog(submissionId) {
    const res = await api.get(`/submissions/${submissionId}/audit-log`);
    return res.data;
  },

  // Reports
  async getReport(submissionId) {
    const res = await api.get(`/submissions/${submissionId}/report`);
    return res.data;
  },

  getReportPdfUrl(submissionId) {
    return `/api/submissions/${submissionId}/report/pdf`;
  },

  getReportCsvUrl(submissionId) {
    return `/api/submissions/${submissionId}/report/csv`;
  },

  getExamCsvUrl(examId) {
    return `/api/exams/${examId}/report/csv`;
  },

  // Jobs
  async getJob(jobId) {
    const res = await api.get(`/jobs/${jobId}`);
    return res.data;
  },
};
