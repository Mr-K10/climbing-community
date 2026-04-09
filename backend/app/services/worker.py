from sqlalchemy.orm import Session
from app.models.models import ClimbingProfile, ProfileTimeline, QuizSession, AnswerLog
from app.services.llm_service import llm_service
from app.core.database import SessionLocal
from sqlalchemy.orm.attributes import flag_modified
import asyncio
import json

async def grade_quiz_session(session_id: str, retry_count: int = 3):
    """
    Grades a completed quiz session using the LLM and updates the user profile.
    Includes exponential backoff retry logic.
    """
    attempt = 0
    while attempt < retry_count:
        db = SessionLocal()
        try:
            # 1. Fetch Session and Actual History
            quiz_session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
            if not quiz_session:
                print(f"Worker Error: Session {session_id} not found.")
                return
                
            profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == quiz_session.user_id).first()
            if not profile:
                print(f"Worker Error: Profile for user {quiz_session.user_id} not found.")
                return
                
            # Fetch actual history from AnswerLog
            history_logs = db.query(AnswerLog).filter(AnswerLog.session_id == session_id).all()
            if not history_logs:
                print(f"Worker Error: No answers found for session {session_id}.")
                return
                
            history = [
                {
                    "question": log.question.text,
                    "category": log.question.category,
                    "is_correct": log.is_correct
                } for log in history_logs
            ]
            
            # 2. Knowledge Delta Extraction (Profile Manager Agent)
            delta_data = await llm_service.extract_knowledge_delta(history, {
                "radar_chart": profile.radar_chart,
                "preferences": {
                    "discipline": profile.primary_discipline,
                    "grade": profile.current_grade
                }
            })
            
            # 3. Commit Timeline & Updates
            summary = delta_data.get("summary", "Quiz assessment completed.")
            updates = delta_data.get("radar_chart_updates", {})
            
            if updates:
                if not profile.radar_chart:
                    profile.radar_chart = {"Safety": 0, "Technique": 0, "Terminology": 0, "Rope Skills": 0, "Training Science": 0, "Mindset": 0}
                
                for category, value in updates.items():
                    # Robust normalization: "Rope Skills" or "rope_skills" -> "Rope Skills"
                    cat = category.replace("_", " ").title()
                    profile.radar_chart[cat] = max(0, min(100, int(value)))
                
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(profile, "radar_chart")
                
            timeline_event = ProfileTimeline(
                profile_id=profile.id,
                event_type="quiz_completed",
                delta=summary,
                state_snapshot=profile.radar_chart
            )
            db.add(timeline_event)
            profile.status = "ready"
            db.commit()
            
            print(f"Worker successful: Graded session {session_id} on attempt {attempt+1}")
            return # Success
            
        except Exception as e:
            attempt += 1
            wait_time = 2 ** attempt # Exponential backoff
            print(f"Worker Retry {attempt}/{retry_count} for session {session_id} failed: {e}. Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)
        finally:
            db.close()
            
    # Final failure (DLQ surrogate) - ensure status is reset so UI doesn't hang
    print(f"CRITICAL: Worker failed session {session_id} after {retry_count} attempts. Resetting profile status.")
    try:
        db = SessionLocal()
        profile = db.query(ClimbingProfile).join(QuizSession).filter(QuizSession.id == session_id).first()
        if profile:
            profile.status = "ready"
            db.commit()
    except Exception as e:
        print(f"Final status reset failed: {e}")
    finally:
        db.close()
