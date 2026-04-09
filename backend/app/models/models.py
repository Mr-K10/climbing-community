from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    google_id = Column(String, unique=True, index=True)
    name = Column(String)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("ClimbingProfile", back_populates="user", uselist=False)
    quiz_sessions = relationship("QuizSession", back_populates="user")
    answer_logs = relationship("AnswerLog", back_populates="user")

class ClimbingProfile(Base):
    __tablename__ = "climbing_profiles"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    primary_discipline = Column(String)  # bouldering, sport, trad
    current_grade = Column(String)
    indoor_vs_outdoor = Column(String)  # indoor_focused, outdoor_focused, hybrid
    goal = Column(String)
    status = Column(String, default="ready") # ready, updating
    radar_chart = Column(JSON, default={}) # e.g. {"Safety": 0, "Technique": 0}
    
    user = relationship("User", back_populates="profile")
    timeline = relationship("ProfileTimeline", back_populates="profile")

class ProfileTimeline(Base):
    __tablename__ = "profile_timeline"
    id = Column(String, primary_key=True, default=generate_uuid)
    profile_id = Column(String, ForeignKey("climbing_profiles.id"))
    date = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String) # quiz_completed, manual_update
    delta = Column(String)
    state_snapshot = Column(JSON)
    
    profile = relationship("ClimbingProfile", back_populates="timeline")

class Question(Base):
    __tablename__ = "questions"
    id = Column(String, primary_key=True, default=generate_uuid)
    category = Column(String) # safety, technique, etc.
    primary_topics = Column(JSON, nullable=True)
    secondary_topics = Column(JSON, nullable=True)
    text = Column(String)
    image_url = Column(String, nullable=True)
    question_type = Column(String, default="multiple_choice")
    sources = Column(JSON, nullable=True) # e.g. [{"title": "Web Page", "url": "https://..."}]
    
    choices = relationship("Choice", back_populates="question")

class Choice(Base):
    __tablename__ = "choices"
    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, ForeignKey("questions.id"))
    text = Column(String)
    is_correct = Column(Boolean, default=False)
    explanation = Column(String)
    
    question = relationship("Question", back_populates="choices")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="pending") # pending, active, completed, failed
    selected_keywords = Column(JSON, default=[]) # e.g. ["hampi", "history"]
    is_generating = Column(Boolean, default=False)
    current_question_id = Column(String, ForeignKey("questions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="quiz_sessions")
    answers = relationship("AnswerLog", back_populates="session")
    current_question = relationship("Question")

class AnswerLog(Base):
    __tablename__ = "answer_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, ForeignKey("quiz_sessions.id"))
    question_id = Column(String, ForeignKey("questions.id"))
    choice_id = Column(String, ForeignKey("choices.id"))
    is_correct = Column(Boolean)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="answer_logs")
    session = relationship("QuizSession", back_populates="answers")
    question = relationship("Question")
    choice = relationship("Choice")
