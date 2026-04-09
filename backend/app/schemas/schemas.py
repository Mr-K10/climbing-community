from pydantic import BaseModel, UUID4, EmailStr, Field, field_validator
from typing import List, Optional, Dict
from datetime import datetime
import re

# Regex for Boulder: Font / V-Scale (e.g., 7A / V6)
BOULDER_RE = re.compile(r"^[0-9A-C][a-c]?\+?\s?/\s?V([0-9]|1[0-7])$", re.IGNORECASE)
# Regex for Sport/Trad: French / YDS (e.g., 7a / 5.11d)
SPORT_RE = re.compile(r"^[0-9][a-c]\+?\s?/\s?5\.([5-9]|1[0-5][a-d]?)$", re.IGNORECASE)

class PreferencesUpdate(BaseModel):
    primary_discipline: str = Field(..., description="bouldering, sport, trad")
    current_grade: str
    indoor_vs_outdoor: str = Field(..., description="indoor_focused, outdoor_focused, hybrid")
    goal: str

    @field_validator("primary_discipline")
    @classmethod
    def validate_discipline(cls, v: str) -> str:
        allowed = ["bouldering", "sport", "trad"]
        if v.lower() not in allowed:
            raise ValueError(f"Discipline must be one of {allowed}")
        return v.lower()

    @field_validator("current_grade")
    @classmethod
    def validate_grade(cls, v: str) -> str:
        if not (BOULDER_RE.match(v) or SPORT_RE.match(v)):
            raise ValueError("Invalid grade format. Use 'Font / V-Scale' or 'French / YDS' (e.g., '7A / V6' or '7a / 5.11d')")
        return v

    @field_validator("indoor_vs_outdoor")
    @classmethod
    def validate_focus(cls, v: str) -> str:
        allowed = ["indoor_focused", "outdoor_focused", "hybrid"]
        if v.lower() not in allowed:
            raise ValueError(f"Focus must be one of {allowed}")
        return v.lower()

class ProfileData(BaseModel):
    user_id: str
    status: str
    preferences: Dict[str, str]
    radar_chart: Dict[str, int]
    recent_timeline_events: List[Dict]

class ProfileResponse(BaseModel):
    status: str
    data: ProfileData
    source: str

class QuizOption(BaseModel):
    id: str
    text: str

class QuestionResponse(BaseModel):
    id: str
    category: str
    primary_topics: Optional[List[str]] = None
    secondary_topics: Optional[List[str]] = None
    text: str
    image_url: Optional[str] = None
    type: str = "multiple_choice"
    sources: Optional[List[Dict[str, str]]] = None # e.g. [{"title": "Web Page", "url": "https://..."}]
    options: List[QuizOption]

class QuizFetchResponse(BaseModel):
    session_id: str
    total_questions: int
    questions: List[QuestionResponse]

class AnswerPayload(BaseModel):
    question_id: str
    selected_option_id: str

class QuizInitRequest(BaseModel):
    keywords: List[str]

    @field_validator("keywords")
    @classmethod
    def validate_keywords(cls, v: List[str]) -> List[str]:
        allowed = ["hampi", "sethan", "bangalore", "history", "sport", "trad", "bouldering", "rescue", "training", "mindset", "badami", "yosemite"]
        if len(v) > 12:
            raise ValueError("Must select between 0 and 12 keywords.")
        for kw in v:
            if kw.lower() not in allowed:
                raise ValueError(f"Invalid keyword: {kw}")
        return [kw.lower() for kw in v]

class AdaptiveQuestionResponse(BaseModel):
    session_id: str
    status: str # ongoing, completed, failed
    question: Optional[QuestionResponse] = None

class AdaptiveAnswerResponse(BaseModel):
    status: str # ongoing, completed
    is_correct: bool
    correct_option_id: str
    explanation: Optional[str]
    next_question: Optional[QuestionResponse] = None
    knowledge_nodes_updated: Optional[List[str]] = None
