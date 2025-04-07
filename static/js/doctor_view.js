const recordBtn = document.getElementById('record-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const audioPreview = document.getElementById('audio-preview');
const transcriptOutput = document.getElementById('transcript-output');
const pulseRing = document.getElementById('voice-visualizer'); 


let mediaRecorder, audioChunks = [];

if (recordBtn) {
  recordBtn.addEventListener('click', async () => {
    if (recordBtn.textContent.includes("Start")) {
      // Request mic and start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      startTimer();

      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        //document.getElementById("listening-text").style.display = 'none';
        document.getElementById("listening-text").style.visibility = 'hidden';
        stopTimer();
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioURL = URL.createObjectURL(audioBlob);
        audioPreview.src = audioURL;
        audioPreview.style.display = 'block';

        pulseRing.style.display = "none";
        


        // Prepare data
        const formData = new FormData();
        formData.append("audio_file", audioBlob, "recording.webm");
        formData.append("patient_id", document.getElementById("patient_id").value);
        formData.append("patient_name", document.getElementById("patient_name").value);
        formData.append("reason", document.getElementById("reason").value);

        transcriptOutput.innerText = "⏳ Creating Medical Receord...";

        const response = await fetch("/save-recording", {
          method: "POST",
          body: formData
        });

        
        const result = await response.json();

        // Hide visit section and show markdown section
        document.getElementById('visit-section').style.display = 'none';
        document.getElementById('markdown-viewer').style.display = 'block';

        // Render markdown inside viewer
        document.getElementById('markdown-content').innerHTML = marked.parse(result.summary);

      };

      mediaRecorder.start();

      pulseRing.style.display = "block";
      document.getElementById("listening-text").textContent = "Listening..."; //Adds listening text
      document.getElementById("listening-text").style.visibility = 'visible';


      // Toggle buttons
      recordBtn.textContent = "Save Recording";
      recordBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Recording';
      pauseBtn.style.display = 'inline-block';
    } else {
      
      // Stop recording and save
      mediaRecorder.stop();
      recordBtn.textContent = "Start Recording";
      recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
    }
  });
}

pauseBtn.addEventListener('click', () => {
  mediaRecorder.pause();
  clearInterval(timerInterval);
  document.getElementById("listening-text").textContent = " Paused. Click resume to continue recording.";
  document.getElementById("listening-text").style.visibility = 'visible';

  //document.getElementById("listening-text").style.visibility = 'hidden';

  pulseRing.style.animationPlayState = 'paused'; // ⏸️ pause animation
  pauseBtn.style.display = 'none';
  resumeBtn.style.display = 'inline-block';
});

resumeBtn.addEventListener('click', () => {
  mediaRecorder.resume();
  resumeTimer();
  document.getElementById("listening-text").textContent = "Listening...";
  document.getElementById("listening-text").style.visibility = 'visible';

  
  //document.getElementById("listening-text").style.visibility = 'visible';
  pulseRing.style.animationPlayState = 'running'; // ▶️ resume animation
  resumeBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
});
// Markdown Viewer Toggle Logic
document.querySelectorAll('.visit').forEach(el => {
  el.addEventListener('click', () => {
    const transcript = el.querySelector('.visit-transcript')?.textContent || '';
    console.log("test");
    document.getElementById('visit-section').style.display = 'none';
    document.getElementById('markdown-viewer').style.display = 'block';
    document.getElementById('markdown-content').innerHTML = marked.parse(transcript);
  });
});

document.querySelectorAll('.patient-info-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('visit-section').style.display = 'block';
    document.getElementById('markdown-viewer').style.display = 'none';
  });
});

//Timer related JS code
let timerInterval, seconds = 0;
function startTimer() {
  seconds = 0;
  document.getElementById("live-timer").style.display = "block";
  timerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    document.getElementById("live-timer").textContent = `⏱️ ${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  document.getElementById("live-timer").style.display = "none";
}

function resumeTimer() {
  const timer = document.getElementById("live-timer");
  timer.style.display = "block";

  timerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timer.textContent = `⏱️ ${mins}:${secs}`;
  }, 1000);
}