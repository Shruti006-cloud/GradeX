import api from './api';

export const examService = {
  async listExams() {
    const res = await api.get('/exams');
    return res.data;
  },

  async createExam(data) {
    const res = await api.post('/exams', data);
    return res.data;
  },

  async getExam(id) {
    const res = await api.get(`/exams/${id}`);
    return res.data;
  },

  async updateExam(id, data) {
    const res = await api.put(`/exams/${id}`, data);
    return res.data;
  },

  async deleteExam(id) {
    await api.delete(`/exams/${id}`);
  },

  // Question Paper & Questions
  async uploadQuestionPaper(examId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/exams/${examId}/questions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { job_id, message }
  },

  async listQuestions(examId) {
    const res = await api.get(`/exams/${examId}/questions`);
    return res.data;
  },

  async createQuestion(examId, data) {
    const res = await api.post(`/exams/${examId}/questions`, data);
    return res.data;
  },

  async updateQuestion(examId, qId, data) {
    const res = await api.put(`/exams/${examId}/questions/${qId}`, data);
    return res.data;
  },

  async deleteQuestion(examId, qId) {
    await api.delete(`/exams/${examId}/questions/${qId}`);
  },

  async confirmQuestions(examId) {
    const res = await api.post(`/exams/${examId}/questions/confirm`);
    return res.data;
  },

  // Answer Key
  async uploadAnswerKey(examId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/exams/${examId}/answer-key/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { job_id, message }
  },

  async generateAnswerKey(examId) {
    const res = await api.post(`/exams/${examId}/answer-key/generate`);
    return res.data; // { job_id, message }
  },

  async listAnswerKeys(examId) {
    const res = await api.get(`/exams/${examId}/answer-key`);
    return res.data;
  },

  async updateAnswerKey(examId, akId, data) {
    const res = await api.put(`/exams/${examId}/answer-key/${akId}`, data);
    return res.data;
  },

  async confirmAnswerKey(examId) {
    const res = await api.post(`/exams/${examId}/answer-key/confirm`);
    return res.data;
  },
};
