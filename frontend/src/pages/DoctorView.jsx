import React, { useEffect, useRef, useState } from 'react'
import client from '../api/client'
import Header from '../components/Header'
import { marked } from 'marked'
import { Eye, EyeOff, Mic, Pause, Trash2, X, Sparkles, Play, Square } from 'lucide-react'
import Lottie from 'lottie-react';
import animation from '../assets/recording.json';

export default function DoctorView() {
  const [appointments, setAppointments] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPastVisits, setShowPastVisits] = useState(true)
  const [expandedVisit, setExpandedVisit] = useState(null)

  const [recording, setRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunks = useRef([])
  const recordingIntervalRef = useRef(null)

  const fetchAppointments = async () => {
    try {
      const res = await client.get('/doctor')
      setAppointments(res.data.upcoming_appointments || [])
      setSelectedPatient(res.data.selected_patient_data || null)
    } catch (err) {
      console.error('Failed to fetch doctor dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const handleRecordToggle = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunks.current = []

        mediaRecorder.ondataavailable = e => audioChunks.current.push(e.data)

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setAudioURL(url)
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setRecording(true)
        setRecordingTime(0)
        setIsPaused(false)
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('Error accessing microphone', err)
      }
    } else {
      mediaRecorderRef.current.stop()
      setRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }

  const handlePauseResume = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder) return

    if (isPaused) {
      mediaRecorder.resume()
      setIsPaused(false)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      mediaRecorder.pause()
      setIsPaused(true)
      clearInterval(recordingIntervalRef.current)
    }
  }

  const handleAudioDelete = () => {
    setAudioURL(null)
    audioChunks.current = []
    setRecordingTime(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const onSubmitRecording = async () => {
    if (!audioChunks.current.length || !selectedPatient) return

    setSubmitting(true);

    const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio_file', blob, 'recording.weba')
    formData.append('patient_id', selectedPatient.patient.patient_id)
    formData.append('patient_name', selectedPatient.patient.patient_name)
    formData.append('reason', selectedPatient.patient.reason || 'General Consultation')

    try {
      const response = await client.post('/save-recording', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAudioURL(null)
      audioChunks.current = []
      setRecordingTime(0)
      await fetchAppointments()
      setSubmitting(false);
    } catch (error) {
      console.error('Failed to submit recording:', error)
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-[93vh] text-gray-900 dark:text-gray-100">
      <Header
        links={[{ to: '/doctor', label: 'Dashboard' }, { to: '/patients', label: 'Patients' }]}
        showLogout
      />

      <div className="relative flex-grow overflow-hidden rounded-2xl flex bg-gray-100 min-h-[86.5vh] max-h-[86.5vh] px-6 py-6 gap-x-4">
        <aside className="w-1/4 flex flex-col bg-gray-50 scroll rounded-2xl custom-shadow dark:bg-gray-800/30 backdrop-blur-sm p-8 overflow-auto">
          <h3 className="text-lg font-light mb-8 text-gray-900 dark:text-white">Today's Schedule</h3>
          {appointments.length > 0 ? (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-6">
                {appointments.map(appt => (
                  <div
                    key={appt.patient_id}
                    onClick={() => setSelectedPatient({
                      patient: appt,
                      past_visits: []
                    })}
                    className="relative pl-16 cursor-pointer group"
                  >
                    <div className={`absolute top-4 left-4 w-4 h-4 dark:bg-gray-800 border-2 border-amber-400 rounded-full group-hover:bg-amber-400 transition-colors duration-200 ${selectedPatient.patient.patient_id === appt.patient_id ? "bg-amber-400" : "bg-white"}`}></div>
                    <div className="absolute left-16 -translate-x-full top-10">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {new Date(appt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 shadow-md dark:bg-gray-800/40 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-800/60 transition-all duration-200 ml-2">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={`${appt.profile_image}`}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-gray-900 dark:text-white truncate text-md group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {appt.patient_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {appt.reason || 'General consultation'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">30 min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-light">No appointments scheduled</p>
            </div>
          )}
        </aside>

        <main className="flex-1 rounded-2xl bg-gray-50 dark:bg-gray-900 p-6 overflow-auto custom-shadow scroll">
          {!selectedPatient ? (
            <p className="text-gray-500 text-center mt-20">Select a patient to begin a visit.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img src={`${selectedPatient.patient.profile_image}`} className="w-16 h-16 rounded-full" alt="Selected Patient" />
                <div className="text-left">
                  <p className="text-2xl font-bold">{selectedPatient.patient.patient_name}</p>
                  <p className="text-sm text-gray-500">{selectedPatient.patient.email}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-medium flex items-center gap-2">
                    <button
                      onClick={() => setShowPastVisits(prev => !prev)}
                      className="text-black dark:text-amber-400 hover:text-black/50 dark:hover:text-amber-300"
                    >
                      {showPastVisits ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                    Past Visits
                  </h3>
                </div>

                {showPastVisits && (
                  selectedPatient.past_visits && selectedPatient.past_visits.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 w-max pr-4">
                        {selectedPatient.past_visits.map(v => (
                          <div
                            key={v.id}
                            className="cursor-pointer border border-gray-200 bg-white dark:bg-gray-800 rounded-lg p-4 min-w-[200px] max-w-xs"
                            onClick={() => setExpandedVisit(prev => prev?.id === v.id ? null : v)}
                          >
                            <p className="text-sm text-gray-500 mb-1">
                              {new Date(v.timestamp).toLocaleDateString()} - {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="font-medium mb-2">{v.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No past visits found for this patient.</p>
                  )
                )}
              </div>

              {expandedVisit && (
                <div className="mt-6 custom-shadow rounded-xl bg-white dark:bg-gray-800 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold">Transcript for: {expandedVisit.reason}</h4>
                    <button onClick={() => setExpandedVisit(null)} className="text-gray-500 hover:text-red-500">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="prose dark:prose-invert max-w-none markdown-box" dangerouslySetInnerHTML={{ __html: marked.parse(expandedVisit.transcript || '') }} />
                </div>
              )}

              {!expandedVisit && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="text-black dark:text-amber-400 hover:text-black/50 dark:hover:text-amber-300" size={24} />
                    <h3 className="text-2xl font-medium">Start a Visit</h3>
                  </div>
                  <p className="text-base text-gray-500 mb-4">Speak naturally. We’ll handle the rest.</p>
                  <div className="p-8 rounded-xl custom-shadow flex flex-col items-center justify-center space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-4">
                      {recording && (
                        <div>
                          <div className="w-[300px] h-[300px] z-50">
                            <Lottie animationData={animation} style={{ height: 300, width: 300}} />
                          </div>
                          <span className="text-lg font-mono text-gray-700">⏱ {formatTime(recordingTime)}</span>
                        </div>
                      )}
                    </div>
                    {!audioURL ? (
                      <div className="flex flex-col items-center space-y-2">
                        {!recording ? (
                          <button
                            className="record-btn record-btn--action mx-auto"
                            onClick={handleRecordToggle}
                          >
                            <span>Begin Session</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <button
                              className="record-btn record-btn--action items-center gap-1"
                              onClick={handlePauseResume}
                            >
                              {isPaused ? (
                                <><Play size={20} className="fill-black" /> Resume</>
                              ) : (
                                <><Pause size={20} className="fill-black" /> Pause</>
                              )}
                            </button>
                            <button
                              className="record-btn record-btn--action gap-1 items-center"
                              onClick={handleRecordToggle}
                            >
                              <Square size={20} className="fill-black" /> End Session
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <audio className="mx-auto" controls src={audioURL} />
                        <div className="flex items-center gap-4">
                          <button
                            disabled={submitting}
                            onClick={handleAudioDelete}
                            className="record-btn record-btn--action items-center gap-1"
                          >
                            <Trash2 size={20} className="fill-black" /> Discard Session
                          </button>
                          <button
                            disabled={submitting}
                            onClick={onSubmitRecording}
                            className="record-btn record-btn--action gap-1 items-center"
                          >
                            <Sparkles size={20} className={`fill-black ${submitting ? "animate-pulse" : ""}`} /> {submitting ? "Just a moment..." : "Submit Session"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style>{`
  .record-btn {
    padding: 15px;
    font-weight: 600;
    font-size: 1rem;
    text-align: center;
    transition: all 0.5s ease;
    cursor: pointer;
  }
  .record-btn--action {
  display: inline-flex; /* Ensures padding and content define size */
  padding: 1rem 2rem;
  border-radius: 1.5rem;
  background-color: #f6e58d;
  color: #000;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  transition: all 0.5s ease 0s;
  box-shadow: 0 10px #f9ca24;
  cursor: pointer;
}
  .record-btn--action span {
    display: inline-block;
    transition: none;
  }
  .record-btn--action:active {
    box-shadow: 0 5px #f0932b;
    transform: translateY(5px);
  }
`}</style>
    </div>
  )
}
