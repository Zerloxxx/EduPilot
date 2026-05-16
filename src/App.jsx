import React from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import BottomNav from './components/BottomNav'
import PhoneFrame from './components/PhoneFrame'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import LevelScreen from './pages/LevelScreen'
import Chat from './pages/Chat'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import DiagnosticTest from './pages/DiagnosticTest'
import ReviewScreen from './pages/ReviewScreen'
import ExamSim from './pages/ExamSim'

const PAGES_WITH_NAV = ['/home', '/chat', '/progress', '/profile']

// Обёртка: key={sectionId-levelIndex} гарантирует что React создаёт
// НОВЫЙ экземпляр LevelScreen при каждой смене уровня или раздела.
// Без этого React переиспользует компонент, mode остаётся 'theory',
// а у нового уровня нет theory данных → краш.
function LevelScreenWrapper() {
  const { sectionId, levelIndex } = useParams()
  return <LevelScreen key={`${sectionId}-${levelIndex}`} />
}

function AppContent() {
  const location = useLocation()
  const showNav = PAGES_WITH_NAV.some(p => location.pathname.startsWith(p))

  return (
    <PhoneFrame bottomNav={showNav ? <BottomNav /> : null}>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/level/:sectionId/:levelIndex" element={<LevelScreenWrapper />} />
        <Route path="/diagnostic" element={<DiagnosticTest />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/exam-sim/:examKey" element={<ExamSim />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
