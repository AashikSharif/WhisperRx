// src/pages/AboutPage.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { Mic, FileText, LayoutDashboard, Clock, ShieldCheck } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-[93vh] text-gray-900 dark:text-gray-100">
      <Header
        links={[
          { to: '/', label: 'Home' },
          { to: '/about', label: 'About' }
        ]}
      />

      <main className="relative flex-grow overflow-hidden rounded-2xl flex bg-gray-100 min-h-[86.5vh] max-h-[86.5vh] px-6 py-6">
        <section className="w-full rounded-2xl bg-gray-100 dark:bg-gray-900 p-8 overflow-auto scroll">
          <h1 className="text-4xl font-light mb-6 text-center">About WhisperRx</h1>

          <p className="max-w-3xl mx-auto mb-10 text-lg leading-relaxed text-center text-gray-500">
            WhisperRx is an AI-powered medical scribing tool designed to assist doctors in creating structured, accurate, and efficient medical reports from audio conversations. Using the latest advancements in speech-to-text (via Whisper) and natural language generation (via LLaMA 3), WhisperRx transforms voice recordings into complete, structured medical notes in real time.
          </p>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 custom-shadow text-center flex flex-col items-center">
              <Mic className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Voice-Based Input</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record consultations and let the AI transcribe and structure them.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 custom-shadow text-center flex flex-col items-center">
              <FileText className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Intelligent Summarization</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Leveraging LLaMA 3, we generate SOAP-format medical summaries automatically.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 custom-shadow text-center flex flex-col items-center">
              <LayoutDashboard className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Designed for All</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Two unique dashboards to streamline workflows for doctors and patients.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 custom-shadow text-center flex flex-col items-center">
              <Clock className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Easy Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review past visits, view structured transcripts, and download reports easily.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 custom-shadow text-center flex flex-col items-center">
              <ShieldCheck className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Privacy & Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">All data is securely handled with role-based access control.</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-12">
            <Link to="/login" className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-medium hover:bg-amber-600 transition">
              Login
            </Link>
            <Link to="/signup" className="px-6 py-3 bg-white text-gray-700 border border-gray-500 rounded-2xl font-medium hover:bg-gray-100 transition">
              Signup
            </Link>
          </div>

          <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 WhisperRx | All Rights Reserved</p>
            <p className="mt-2">
              Made with <span className="text-red-500">♥</span> by
              {' '}<a href="https://www.linkedin.com/in/aashiksharif/" target="_blank" className="underline">Aashik Sharif Basheer Ahamed</a>
              {','} {' '}
              <a href="https://www.linkedin.com/in/shlok-tomar/" target="_blank" className="underline">Shlok Tomar</a>
              {' '} & {' '}
              <a href="https://www.linkedin.com/in/peersahab/" target="_blank" className="underline">Sheheryar Pirzada</a>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
