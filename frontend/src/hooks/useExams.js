/**
 * useExams hook – fetch and manage exams list.
 * @returns {{ exams, loading, error, refetch }}
 */
import { useState, useEffect } from 'react'
import api from '../services/api.js'

export function useExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/exams/')
      setExams(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [])

  return { exams, loading, error, refetch }
}
