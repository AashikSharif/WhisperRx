from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # Ensured password is required
    user_type = db.Column(db.String(50))  # "doctor" or "patient"
    profile_image = db.Column(db.String(300))
    

class AppointmentBooking(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Fixed typo here
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Added index for performance
    reason = db.Column(db.String(200), nullable=False)  # Changed 'Reason' to lowercase and made it required
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # Default timestamp and index

#     # Define relationship to the User model
    patient = db.relationship('User', backref=db.backref('appointments', lazy=True))

class Visit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Added index for performance
    audio_file = db.Column(db.String(300))
    transcript = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # Added index for performance
    reason = db.Column(db.String(200), nullable=False)

#####################################################
# Sample users with hashed passwords
#####################################################

users = [
    User(name='Dr. Maya Sharma', email='maya.sharma@whisperrx.com', password=generate_password_hash('test123'), user_type='doctor',profile_image='/static/default_avatar.jpg'),
    User(name='Shlok Verma', email='shlok@whisperrx.com', password=generate_password_hash('test123'), user_type='patient',profile_image='/static/verma.webp'),
    User(name='Ashu Patel', email='ashu@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/Aashik_Sharif.png'),
    User(name='Sherry Dsouza', email='sherry@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/sherry.jpg'),
    User(name='Amav Jain', email='amav@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/arnav.jpg'),
    User(name='Mary', email='mary@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/kid_bruv.jpeg'),
    User(name='Stacy', email='stacy@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/smart_bruv.jpeg'),
    User(name='Joseph', email='joseph@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/uncle_bruv.jpeg'),
    User(name='Sam Altman', email='sam@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/same_bruv.jpeg'),
    User(name='Xu Lin', email='xulin@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/asian.jpeg'),
    User(name='Veronica Singh', email='vsing@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/download.jpeg'),
    User(name='Thomas Sherry', email='thom@whisperrx.com', password=generate_password_hash('test'), user_type='patient',profile_image='/static/kid.jpeg'),
    User(name='Dr. Jackson', email='jack@whisperrx.com', password=generate_password_hash('test'), user_type='doctor',profile_image='/static/jack.jpg'),
]
appointments = [
    AppointmentBooking(patient_id=2, reason='Flu + Cold', timestamp=datetime(2025, 4, 7, 10, 41)),
    AppointmentBooking(patient_id=3, reason='Broken Leg', timestamp=datetime(2025, 4, 7, 11, 15)),
    AppointmentBooking(patient_id=4, reason='STI', timestamp=datetime(2025, 4, 7, 12, 00)),
    AppointmentBooking(patient_id=5, reason='Nausea, sick', timestamp=datetime(2025, 4, 8 , 10, 00)),
    AppointmentBooking(patient_id=8, reason='diarhea', timestamp=datetime(2025, 4, 8, 10, 35)),
    AppointmentBooking(patient_id=9, reason='flu', timestamp=datetime(2025, 4, 8, 4, 35)),
    AppointmentBooking(patient_id=11, reason='blisters', timestamp=datetime(2025, 4, 8, 12, 35)),
]
visits = [
    Visit(
        patient_id=2,
        audio_file='static/audio/shlok_visit1.wav',
        transcript='Patient had fever and cold for two days.',
        timestamp=datetime(2024, 3, 18, 10, 15),
        reason= 'Sore throat'
    ),
    Visit(
        patient_id=2,
        audio_file='static/audio/shlok_visit2.wav',
        transcript="""# Patient Medical Report  Annual Checkup

**Name:** Shlok Varma  
**DOB:** 01/15/2001  
**Date:** 01/07/2025  
**Provider:** Dr. Sarah Langston, MD  

---

## **S - Subjective**
- **Reason for Visit:** Annual checkup  
- **Symptoms:** None reported  
- **Overall Health:** Feels well, no recent illness or major changes  
- **Medications:** Lisinopril 10 mg daily  
- **Allergies:** None  
- **Lifestyle:** Exercises regularly, healthy diet, no smoking, occasional alcohol

---

## **O - Objective**
- **Vitals:**
  - BP: 128/82 mmHg  
  - HR: 72 bpm  
  - Temp: 98.4°F  
  - BMI: 25.8  

- **Physical Exam:**
  - General: Healthy appearance  
  - Heart: Normal  
  - Lungs: Clear  
  - Abdomen: Normal  
  - Neuro: Normal

---

## **A - Assessment**
- Stable hypertension  
- Overweight  
- No acute medical concerns

---

## **P - Plan**
- Continue current medication  
- Encourage healthy eating and exercise  
- Ordered blood tests (lipid panel, HbA1c)  
- Gave flu shot  
- Recommend COVID booster  
- Follow-up in 12 months or as needed

---
""",
        timestamp=datetime(2025, 1, 7, 11, 30),
        reason= 'Annnual Checkup'
    ),
    Visit(
        patient_id=3,
        audio_file='static/audio/ashu_post_leg.wav',
        transcript='Post leg surgery follow-up. Healing well.',
        timestamp=datetime(2024, 9, 12, 15, 20),
        reason= 'leg cut'
    ),
    Visit(
        patient_id=4,
        audio_file='static/audio/sherry_trauma.wav',
        transcript="""# Patient Medical Report  STI Screeing

**Name:** Sheheryar Ahmed Pirzada 
**DOB:** 07/12/1998  
**Date:** 03/23/2025  
**Provider:** Dr. Emily Carter, MD  
**Visit Type:** STI Screening  

---

## **S - Subjective**
- **Reason for Visit:** STI screening and evaluation of recurring genital sores  
- **Symptoms:**  
  - Reports occasional painful blisters around the genital area for the past 6 months  
  - Current episode started 2 days ago – mild burning sensation and small grouped sores  
  - No fever, rash, or discharge  
- **Sexual History:**  
  - Sexually active  
  - Multiple partners in the past year  
  - Inconsistent condom use  
- **Past STI history:** None known  
- **Allergies:** None  
- **Medications:** None  

---

## **O - Objective**
- **Vitals:**
  - Temp: 98.6°F  
  - BP: 116/74 mmHg  
  - HR: 76 bpm  
  - BMI: 22.4  

- **Physical Exam:**
  - External genital exam: Multiple small vesicles with erythematous base on labia majora  
  - No vaginal discharge noted  
  - No inguinal lymphadenopathy  
  - No other skin lesions or oral ulcers  

---

## **A - Assessment**
- Suspected **genital herpes simplex virus (HSV-2)** infection – recurrent episode  
- STI screening recommended due to history of unprotected sex and multiple partners

---

## **P - Plan**
1. **Testing ordered:**
   - HSV PCR from lesion swab  
   - Complete STI panel: HIV, Syphilis (RPR), Gonorrhea, Chlamydia, Hepatitis B/C  
2. **Treatment:**
   - Started on **Acyclovir 400 mg TID for 7 days**  
3. **Counseling:**
   - Discussed nature of HSV – chronic, manageable, transmissible even without symptoms  
   - Advised consistent condom use and partner notification  
4. **Follow-up:**
   - Results will be shared via patient portal  
   - Schedule follow-up in 2 weeks or sooner if worsening symptoms  

---
""",
        timestamp=datetime(2024, 6, 18, 9, 0),
        reason= 'STI Screening'
    ),
]

