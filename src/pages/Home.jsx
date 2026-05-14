import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import HomeCS from './HomeCS'

// All subjects now use the HomeCS unified map layout.
// Subject-specific colors and icons are handled inside HomeCS.
export default function Home() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  if (!progress) {
    navigate('/onboarding')
    return null
  }

  return <HomeCS />
}
