import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import HomeCS from './HomeCS'

export default function Home() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  useEffect(() => {
    if (!progress) navigate('/onboarding', { replace: true })
  }, [progress, navigate])

  if (!progress) return null

  return <HomeCS />
}
