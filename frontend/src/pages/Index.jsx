// src/pages/Index.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mic, FileText, LayoutDashboard, Lock } from 'lucide-react'

export default function IndexPage() {
  const nav = useNavigate()

  // 1. Carousel texts (replace these with your own)
  const carouselTexts = [
    "WhisperRx is an AI-powered medical scribing platform that turns your\n" +
    "            voice consults into structured SOAP notes in real time",
    "Smart Summaries -  Auto-generate SOAP-format reports",
    "Dual Dashboards - Tailored views for doctors and patients",
    "Privacy First - Role based access control"
  ]

  // 2. State & interval to rotate through them
  const [currentIdx, setCurrentIdx] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentIdx(i => (i + 1) % carouselTexts.length)
    }, 5000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex flex-col min-h-[93.5vh]">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 bg-transparent">
        <Link to="/about" className="text-3xl font-light text-gray-500 select-none">WhisperRx</Link>
        <div className="space-x-4">
          <Link
            to="/login"
            className="px-4 py-2 font-light text-gray-500 hover:bg-black/5 rounded-2xl text-xl"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-gray-500 transition hover:bg-black/5 rounded-2xl text-xl"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative flex-grow overflow-hidden rounded-2xl flex">
        {/* background */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-amber-400 to-white
               dark:from-amber-900 dark:via-amber-700 dark:to-gray-900"
          aria-hidden
        />

        {/* curved overlay */}
        <svg
          className="absolute right-0 bottom-0 w-1/2 h-full"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
        >
          <path
            d="M0,800 C400,800 400,0 600,0 L600,800 Z"
            fill="rgba(255,255,255,0.3)"
          />
        </svg>

        {/* bottom-left content */}
        <div className="relative z-10 flex flex-col justify-center items-center
                w-full max-w-screen-xl p-8 mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Smarter Care,
            <br />
            Powered by Voice.
          </h2>

          <p
            key={currentIdx}
            className="mt-4 text-xl text-white/70 min-h-[6rem] flex items-center justify-center transition-opacity duration-700 max-w-xl"
          >
            {carouselTexts[currentIdx]}
          </p>

          {/*<div className="mt-6 flex gap-4">*/}
          {/*  <Link*/}
          {/*    to="/login"*/}
          {/*    className="px-4 py-2 font-light text-gray-50 bg-white/20 rounded-2xl hover:bg-white hover:text-gray-700"*/}
          {/*  >*/}
          {/*    Login*/}
          {/*  </Link>*/}
          {/*  <Link*/}
          {/*    to="/signup"*/}
          {/*    className="px-4 py-2 text-gray-50 transition bg-white/20 rounded-2xl hover:bg-white hover:text-gray-700"*/}
          {/*  >*/}
          {/*    Sign Up*/}
          {/*  </Link>*/}
          {/*</div>*/}
        </div>

      </div>
    </div>
  )
}
