from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
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

# Loads variables from .env file
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
@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password):
            flash('Invalid email or password', 'error')
            return redirect(url_for('login'))

        # Save login session
        session['user_id'] = user.id
        session['user_type'] = user.user_type
        session['user_name'] = user.name

        flash('Login successful!', 'success')

        # Redirect based on role
        if user.user_type == 'doctor':
            return redirect(url_for('doctor_view'))
        else:
            return redirect(url_for('patient_dashboard'))

    return render_template('login.html')


#####################################################
#  Signup PAGE
#####################################################
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        user_type = request.form['user_type']
        image = request.files['profile_image']

        # Hash password
        hashed_password = generate_password_hash(password)

        # Save profile image
        image_filename = None
        if image and image.filename != '':
            filename = secure_filename(image.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], 'images', filename)
            os.makedirs(os.path.dirname(image_path), exist_ok=True)
            image.save(image_path)
            image_filename = image_path

        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered.', 'error')
            return redirect(url_for('signup'))

        # Create user
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            user_type=user_type,
            profile_image=image_filename
        )
        db.session.add(new_user)
        db.session.commit()

        flash('Signup successful! You can now log in.', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

#####################################################
#  DOCTOR PROTAL
#####################################################

@app.route('/doctor', methods=['GET', 'POST'])
def doctor_view():
        
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        flash("Please login first", "info")
        return redirect(url_for('login'))

    All_appointment_data = get_all_appointments()

    selected_pid = request.args.get('patient_id', type=int)

    selected_patient_data = []
    if selected_pid:
        # Find the patient in the list of upcoming appointments
        selected_patient = next((appt for appt in All_appointment_data if appt['patient_id'] == selected_pid), None)

        if selected_patient:
            selected_patient_data.append({
                'patient': selected_patient,
                'past_visits': get_all_past_visits(selected_pid)
            })
    elif All_appointment_data:
        # fallback to first patient
        fallback = All_appointment_data[0]
        selected_patient_data.append({
            'patient': fallback,
            'past_visits': get_all_past_visits(fallback['patient_id'])
        })
            
    return render_template(
    'doctor_view.html',
    upcoming_appointments=All_appointment_data,
    selected_patient_data= selected_patient_data
    )

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
def patient_dashboard():
    if 'user_id' not in session or session.get('user_type') != 'patient':
        flash("Please login first", "info")
        return redirect(url_for('login'))

    patient_id = session['user_id']
    #print(patient_id)
    patient = User.query.get(patient_id)

    # Handle booking appointment
    if request.method == 'POST':
        doctor_id = request.form['doctor_id']
        reason = request.form['reason']
        timestamp_str = request.form['timestamp']
        timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %I:%M %p")

        new_appt = AppointmentBooking(
            patient_id=patient_id,
            reason=reason,
            timestamp=timestamp
        )
        db.session.add(new_appt)
        db.session.commit()
        flash('Appointment booked successfully!', 'success')
        return redirect(url_for('patient_dashboard'))

    # Upcoming appointments
    upcoming_appointments = AppointmentBooking.query.filter_by(patient_id=patient_id)\
        .filter(AppointmentBooking.timestamp >= datetime.utcnow())\
        .order_by(AppointmentBooking.timestamp.asc())\
        .all()

    appt_data = []
    for appt in upcoming_appointments:
        doctor = User.query.get(appt.patient_id)
        appt_data.append({
            'doctor_name': doctor.name if doctor else "Doctor",
            'timestamp': appt.timestamp,
            'reason': appt.reason
        })

    # Fetch available doctors
    doctors = User.query.filter_by(user_type='doctor').all()

    # Past visits
    past_visits = Visit.query.filter_by(patient_id=patient_id).order_by(Visit.timestamp.desc()).all()
    print(past_visits)
    return render_template(
        'patient_dashboard.html',
        patient=patient,
        doctors=doctors,
        upcoming_appointments=appt_data,
        past_visits=past_visits
    )

#####################################################
#  List of Patients PAGE
#####################################################
@app.route('/patients')
def patients_page():
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        flash("Access denied. Please log in.", "danger")
        return redirect(url_for('login'))

    patients = User.query.filter_by(user_type='patient').all()
    
    if not patients:
        flash("No patients found.", "info")

    return render_template("patients.html", patients=patients)

#####################################################
#  List of DOCTORs PAGE
#####################################################
@app.route('/doctors')
def doctors_page():
    if 'user_id' not in session or session.get('user_type') != 'patient':
        flash("Please login first", "info")
        return redirect(url_for('login'))

    doctors = User.query.filter_by(user_type='doctor').all()
    if not doctors:
        flash("No doctors found.", "info")

    return render_template("doctors.html", doctors=doctors)

#####################################################
#  Logout feature implementation
#####################################################

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))  # redirect to your login page

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
    with app.app_context():
        db.drop_all()
        db.create_all()

        db.session.add_all(users)
        db.session.commit()

        db.session.add_all(appointments)
        db.session.add_all(visits)
        db.session.commit()

    app.run(host='0.0.0.0',port=80,debug=True)

#####################################################
#  END OF FILE
#####################################################