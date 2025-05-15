# 🩺 WhisperRx

WhisperRx is an AI-powered medical voice scribing and patient management web application designed for doctors and patients. It simplifies the process of documenting patient visits through voice recordings, AI transcription and automatic generation of structured SOAP medical reports.

## 🎥 Demo

Watch a quick walkthrough of **WhisperRx** in action:

https://github.com/user-attachments/assets/3b2b46ae-8dac-424a-943d-1742da1763f4

---
## 🚀 Features

- **Voice-to-Text Transcription**  
  Doctors can record conversations with patients which are then transcribed using **Cloudflare Whisper**.

- **AI Diagnosis Summarization**  
  Transcripts are passed through **LLaMA 3** to generate structured SOAP (Subjective, Objective, Assessment, Plan) medical summaries.

- **Appointment Booking**  
  Patients can book appointments with doctors using a calendar and time picker interface.

- **Visit History**  
  Both doctors and patients can view past visits, along with transcripts and AI-generated medical notes.

- **Role-Based Dashboards**  
  - Doctors can manage upcoming appointments, record visits, and browse through patient lists.
  - Patients can view appointments, book new ones, and check their medical history.

- **Secure File Uploads**  
  All voice recordings and profile images are securely handled and stored.

- **Responsive UI**  
  Designed to work across both desktop and mobile devices with a clean, intuitive interface.

---

## 🛠️ Tech Stack

- **Backend:** Flask (Python), SQLAlchemy ORM  
- **Frontend:** Jinja2, Tailwind CSS, Flatpickr  
- **Database:** SQLite (can be swapped with PostgreSQL/MySQL)  
- **AI Services:** Cloudflare Whisper (for transcription) & LLaMA 3 (for medical note generation)  
- **Security:** Password hashing with Werkzeug, Session-based login system

---
## 📦 Installation

```bash
git clone https://github.com/yourusername/whisperRx.git
cd whisperrx
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file in your root directory and add the following:

```bash
SECRET_KEY=your_flask_secret_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=Bearer your_cloudflare_api_token
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
```

> Make sure to keep `.env` in your `.gitignore`.

---

## 🧪 Run the App

```bash
flask run
```

App will be available at `http://localhost:5000`

---

## 👥 Contributors

- **Aashik Sharif Basheer Ahamed**  
  [LinkedIn](https://www.linkedin.com/in/aashiksharif/)

- **Shlok Tomar**  
  [LinkedIn](https://www.linkedin.com/in/shlok-tomar/)

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Feedback

If you have suggestions, ideas, or want to collaborate — feel free to open an issue or reach out to the contributors above.

