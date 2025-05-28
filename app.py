from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_cors import CORS

from models import db, User, Visit, AppointmentBooking
from config import Config
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from flask_mail import Mail, Message
from datetime import datetime, timedelta, timezone
from itsdangerous import URLSafeTimedSerializer
import requests
from models import users, appointments, visits
from dotenv import load_dotenv

# Loads variables from ..env file
load_dotenv()

utc_now = datetime.utcnow()
print("UTC",utc_now)
pacific_time = utc_now.astimezone(timezone(timedelta(hours=-14)))
print(pacific_time)

# Your Cloudflare API configuration
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")


#####################################################
#  APP STARTING
#####################################################

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
s = URLSafeTimedSerializer(app.secret_key)
app.config['UPLOAD_FOLDER'] = os.getenv("UPLOAD_FOLDER", "static/uploads/")
mail = Mail()
app.config.from_object(Config)
db.init_app(app)
mail.init_app(app)

s = URLSafeTimedSerializer('your_secret_key')

CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": "http://localhost:5173"}}
)

    
@app.route('/')
def index():
    return render_template('index.html')


def get_all_appointments():
    appointments = AppointmentBooking.query.filter(
        AppointmentBooking.timestamp >= pacific_time
    ).order_by(AppointmentBooking.timestamp.asc()).limit(11).all()
    
    appointment_details = []
    
    for appointment in appointments:
        patient = appointment.patient

        appointment_details.append({
            'patient_id': patient.id,
            'patient_name': patient.name,
            'user_type': patient.user_type,
            'email': patient.email,
            'profile_image': patient.profile_image,
            'reason': appointment.reason,
            'timestamp': appointment.timestamp
        })
    
    return appointment_details

def get_all_past_visits(patient_id):
    # Query all visits for the patient
    visits = Visit.query.filter_by(patient_id=patient_id).order_by(Visit.timestamp.desc()).all()
    # Convert SQLAlchemy objects to dictionaries
    past_visits = []
    for visit in visits:
    
        past_visits.append({
            'id': visit.id,
            'patient_id': visit.patient_id,
            'audio_file': visit.audio_file,
            'transcript': visit.transcript,
            'timestamp': visit.timestamp,
            'reason' : visit.reason
        })
    return past_visits

def run_whisper_cloudflare(file_path):
    url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/openai/whisper"
    headers = {
        "Authorization": CLOUDFLARE_API_TOKEN,
        "Content-Type": "application/octet-stream"
    }
    

    with open(file_path, "rb") as f:
        data = f.read()

    response = requests.post(url, headers=headers, data=data)

    if response.status_code == 200:
        return response.json()['result']['text']
    else:
        print("Whisper BAD REQUEST")
        return ""

def run_llama_cloudflare(inputs, model="@cf/meta/llama-3-8b-instruct"):
    
    url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}"
    headers = {"Authorization": CLOUDFLARE_API_TOKEN}
    payload = {"messages": inputs}

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()['result']['response']
    else:
        print("LLaMA BAD REQUEST")
        return ""

#####################################################
#  LOGIN PAGE
#####################################################
@app.route('/login', methods=['POST'])
def login():
    # Expect JSON { email: "...", password: "..." }
    print('here')
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password required'}), 400

    email = data['email']
    password = data['password']

    print(password)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Set up session cookie
    session.clear()
    session['user_id']   = user.id
    session['user_type'] = user.user_type
    session['user_name'] = user.name

    # Return minimal user info for front-end routing
    return jsonify({
        'message': 'Login successful',
        'user_type': user.user_type,
        'user_name': user.name
    }), 200

@app.route('/login-status', methods=['GET'])
def login_status():
    # If you’re logged in, Flask has set session['user_id'], etc.
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    return jsonify({
        'user_id':   session['user_id'],
        'user_name': session.get('user_name'),
        'user_type': session.get('user_type')
    }), 200

#####################################################
#  Signup PAGE
#####################################################
@app.route('/signup', methods=['POST'])
def signup():
    # Expect JSON: { name, email, password, user_type }
    data = request.get_json()
    if not data or not all(k in data for k in ('name', 'email', 'password', 'user_type')):
        return jsonify({'error': 'Name, email, password and user_type required'}), 400

    name      = data['name']
    email     = data['email']
    password  = data['password']
    user_type = data['user_type']

    # Check if already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Hash & create
    hashed = generate_password_hash(password)
    new_user = User(
        name=name,
        email=email,
        password=hashed,
        user_type=user_type,
        profile_image=None      # handle uploads separately if needed
    )
    db.session.add(new_user)
    db.session.commit()

    # (Optional) log them in immediately
    session.clear()
    session['user_id']   = new_user.id
    session['user_type'] = new_user.user_type
    session['user_name'] = new_user.name

    return jsonify({
        'message':   'Signup successful',
        'user_type': new_user.user_type,
        'user_name': new_user.name
    }), 201

#####################################################
#  DOCTOR PROTAL
#####################################################

@app.route('/doctor', methods=['GET'])
def doctor_view():
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        return jsonify({"error": "Unauthorized. Please log in as a doctor."}), 401

    doctor_id = session['user_id']

    # Filter appointments by this doctor
    appointments = AppointmentBooking.query \
        .filter_by(doctor_id=doctor_id) \
        .order_by(AppointmentBooking.timestamp.asc()) \
        .all()

    all_appointments = []
    for appt in appointments:
        all_appointments.append({
            'id': appt.id,
            'timestamp': appt.timestamp,
            'reason': appt.reason,
            'patient_id': appt.patient.id,
            'patient_name': appt.patient.name,
            'email': appt.patient.email,
            'profile_image': appt.patient.profile_image,
        })

    selected_pid = request.args.get('patient_id', type=int)

    selected_data = None
    if selected_pid:
        selected_patient = next((appt for appt in all_appointments if appt['patient_id'] == selected_pid), None)
        if selected_patient:
            selected_data = {
                'patient': selected_patient,
                'past_visits': get_all_past_visits(selected_pid)
            }
    elif all_appointments:
        fallback = all_appointments[0]
        selected_data = {
            'patient': fallback,
            'past_visits': get_all_past_visits(fallback['patient_id'])
        }

    return jsonify({
        'upcoming_appointments': all_appointments,
        'selected_patient_data': selected_data
    }), 200



#####################################################
#  Recording/Transcript
#####################################################

@app.route('/save-recording', methods=['POST'])
def save_recording():
    audio = request.files.get('audio_file')
    patient_id = request.form.get('patient_id')
    patient_name = request.form.get('patient_name')
    reason = request.form.get('reason')

    if not audio or not patient_id:
        return jsonify({'error': 'Missing audio or patient_id'}), 400
    
    filename = secure_filename(f"recording_ID_({str(patient_id)}_{patient_name}_{datetime.strftime(pacific_time,'%d-%b-%Y-%H-%M')}.weba")
    audio_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'audio')
    os.makedirs(audio_folder, exist_ok=True)
    audio_path = os.path.join(audio_folder, filename)
    audio.save(audio_path)
    
    normalized_path = audio_path.replace("\\", "/")  # Convert for cloud API

    print(f"Audio saved 2: {normalized_path} ({os.path.getsize(audio_path)} bytes)")

    # Step 1: Transcribe with Whisper
    transcript_text = run_whisper_cloudflare(normalized_path)
    print(transcript_text)
    
    # Step 2: Generate Diagnosis Summary using LLaMA
    llama_inputs = [
            {"role": "system", "content": "You are an advanced AI medical scribe specializing in generating structured medical reports from doctor-patient conversations. "
                        "Your goal is to extract key medical details, structure them professionally, and ensure clarity, accuracy, and completeness. Avoid adding unverified information"
                        "Use formal medical terminology, clinical notes should be structured using the SOAP format."
                        "S (Subjective): Include relevant symptoms, patient complaints, duration, severity, and any personal experiences described."
                        "O (Objective): Mention observable facts, vital signs if given, or indications that can be interpreted objectively."
                        "A (Assessment): Provide a brief summary or possible interpretation of the condition based on the subjective and objective data."
                        "P (Plan): Recommend next steps, including potential tests, treatments, or follow-up actions."},

            {"role": "assistant", "content": """The output should be like this:\n markdown\n# Patient Medical Report – [Visit Type]  \n\n**Name:** [Patient Full Name]  \n**DOB:** [MM/DD/YYYY]  \n**Date:** [Visit Date]  \n**Provider:** [Provider Name, Credentials]  \n\n---\n\n## **S – Subjective**\n- **Reason for Visit:** [Brief reason for visit]  \n- **Chief Complaint:** “[Patient's own words about the issue]”  \n- **History of Present Illness:**  \n  - [Age]-year-old [gender] presenting with [summary of symptoms]  \n  - [Timeline of symptoms and progression]  \n  - [Details of any specific symptoms]  \n  - Denies [list of symptoms the patient denies]  \n  - Reports [any additional notes or symptoms]  \n- **Medications:** [List any current medications]  \n- **Allergies:** [List any known allergies or \"None reported\"]  \n- **Past Medical History:** [Optional, if discussed]  \n- **Lifestyle:** [Relevant habits or health-related lifestyle info]  \n\n---\n\n## **O – Objective**\n- **Vital Signs:**\n  - Blood Pressure: [###/## mmHg]  \n  - Heart Rate: [## bpm]  \n  - Temperature: [###.#°F]  \n  - Respiratory Rate: [## breaths per minute]  \n  - BMI: [##.#]  \n\n- **Physical Examination:**\n  - **General:** [General appearance and orientation]  \n  - **HEENT:** [Findings from head, eyes, ears, nose, throat]  \n  - **Chest/Lungs:** [Lung auscultation findings]  \n  - **Cardiovascular:** [Heart rhythm, murmurs, etc.]  \n  - **Abdomen:** [Tenderness, distension, etc.]  \n  - **Neurological:** [Mental status, reflexes, etc.]  \n  - **Skin:** [Rash, cyanosis, etc.]  \n\n---\n\n## **A – Assessment**\n- **[Diagnosis or condition]**  \n  - [Rationale or explanation]  \n- **[Additional diagnoses if any]**  \n- **[Stability or complications noted]**  \n\n---\n\n## **P – Plan**\n- **Treatment & Recommendations:**\n  - [Medications, rest, hydration, etc.]  \n  - [Any prescriptions or refills]  \n  - [Monitoring instructions or red flags]  \n- **Patient Education:**\n  - [Educational guidance on the condition]  \n  - [Recovery expectations and timeline]  \n- **Follow-Up:**\n  - [When to return or seek further care]  \n\n---\n"""},

            {"role": "user","content": f"Here is the Transcript: {transcript_text}. \n"
                        "Generate a structured, professional medical report based on the transcript. "
                        "Ensure medical accuracy and conciseness while preserving all critical details. Give in standardized markdown format"}
        ]

    diagnosis_summary = run_llama_cloudflare(llama_inputs)

    # Step 3: Save to database
    new_visit = Visit(
        patient_id=patient_id,
        audio_file=audio_path,
        transcript=diagnosis_summary,
        reason = reason,
        timestamp=pacific_time
    )
    db.session.add(new_visit)
    db.session.commit()

    return jsonify({'status': 'success', 'transcript': transcript_text, 'summary': diagnosis_summary})

#####################################################
#  Patient Portal PAGE
#####################################################

@app.route('/patient', methods=['GET', 'POST'])
def patient_api():
    # authentication & role check
    if 'user_id' not in session or session.get('user_type') != 'patient':
        return jsonify({'error': 'Unauthorized'}), 401

    patient_id = session['user_id']

    # POST → book new appointment
    if request.method == 'POST':
        data = request.get_json() or {}
        # validate
        if not all(k in data for k in ('doctor_id', 'reason', 'timestamp')):
            return jsonify({'error': 'doctor_id, reason and timestamp are required'}), 400

        try:
            # expect ISO-formatted string e.g. "2025-05-27T14:30:00"
            ts = datetime.fromisoformat(data['timestamp'])
        except ValueError:
            return jsonify({'error': 'Invalid timestamp format'}), 400

        new_appt = AppointmentBooking(
            patient_id=patient_id,
            doctor_id=data['doctor_id'],
            reason=data['reason'],
            timestamp=ts
        )
        db.session.add(new_appt)
        db.session.commit()

        return jsonify({'message': 'Appointment booked successfully'}), 201

    # GET → fetch dashboard data
    # patient details
    patient = User.query.get(patient_id)
    patient_info = {
        'id': patient.id,
        'name': patient.name,
        'email': patient.email,
        'profile_image': patient.profile_image
    }

    # available doctors for dropdown
    doctors = [
        {'id': d.id, 'name': d.name}
        for d in User.query.filter_by(user_type='doctor')
    ]

    # upcoming appointments
    upcoming = AppointmentBooking.query \
        .filter_by(patient_id=patient_id) \
        .filter(AppointmentBooking.timestamp >= datetime.utcnow()) \
        .order_by(AppointmentBooking.timestamp.asc()) \
        .all()

    upcoming_appointments = [
        {
            'id': appt.id,
            'doctor_id': appt.doctor_id,
            'doctor_name': User.query.get(appt.doctor_id).name,
            'reason': appt.reason,
            'timestamp': appt.timestamp.isoformat()
        }
        for appt in upcoming
    ]

    # past visits
    visits = Visit.query.filter_by(patient_id=patient_id) \
        .order_by(Visit.timestamp.desc()) \
        .all()
    past_visits = [
        {
            'id': v.id,
            'timestamp': v.timestamp.isoformat(),
            'reason': v.reason,
            'transcript': v.transcript
        }
        for v in visits
    ]

    return jsonify({
        'patient': patient_info,
        'doctors': doctors,
        'upcoming_appointments': upcoming_appointments,
        'past_visits': past_visits
    }), 200

#####################################################
#  List of Patients PAGE
#####################################################

@app.route('/patients', methods=['GET'])
def get_patients():
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        return jsonify({"error": "Access denied. Please log in as a doctor."}), 401

    patients = User.query.filter_by(user_type='patient').all()

    if not patients:
        return jsonify({"message": "No patients found.", "patients": []}), 200

    patient_list = [
        {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "profile_image": patient.profile_image,  # optional
        }
        for patient in patients
    ]

    return jsonify({"patients": patient_list}), 200


#####################################################
#  List of DOCTORs PAGE
#####################################################

@app.route('/doctors', methods=['GET'])
def get_doctors():
    if 'user_id' not in session or session.get('user_type') != 'patient':
        return jsonify({"error": "Unauthorized access. Please login as a patient."}), 401

    doctors = User.query.filter_by(user_type='doctor').all()

    if not doctors:
        return jsonify({"message": "No doctors found.", "doctors": []}), 200

    doctor_list = [
        {
            "id": doctor.id,
            "name": doctor.name,
            "email": doctor.email,
            # "specialty": doctor.specialty,  # if such a field exists
            "profile_image": doctor.profile_image,  # optional
        }
        for doctor in doctors
    ]

    return jsonify({"doctors": doctor_list}), 200


#####################################################
#  Logout feature implementation
#####################################################

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."}), 200

#####################################################
#  To avoid logging in by pressing back in browser.
#####################################################


@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

#####################################################
#  ABOUT PAGE
#####################################################


@app.route('/about')
def about_page():
    return render_template("about.html")

#####################################################
#  Main function
#####################################################

if __name__ == '__main__':
    # with app.app_context():
        # db.drop_all()
        # db.create_all()
        #
        # db.session.add_all(users)
        # db.session.commit()
        #
        # db.session.add_all(appointments)
        # db.session.add_all(visits)
        # db.session.commit()

    app.run(host='0.0.0.0',port=80,debug=True)

#####################################################
#  END OF FILE
#####################################################