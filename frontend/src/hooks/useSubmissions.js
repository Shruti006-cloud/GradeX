/**
 * useSubmissions hook – fetch submissions for an exam.
 * @param {number} examId
 * @returns {{ submissions, loading, error, refetch }}
 */
import { useState, useEffect } from 'react'
import api from '../services/api.js'

export function useSubmissions(examId) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = async () => {
    if (!examId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/exams/${examId}/submissions/`)
      setSubmissions(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [examId])

  return { submissions, loading, error, refetch }
}
