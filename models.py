from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


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

