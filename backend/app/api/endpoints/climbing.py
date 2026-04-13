from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, ClimbingProfile, ProfileTimeline, Question, Choice, QuizSession, AnswerLog
from app.schemas.schemas import PreferencesUpdate, ProfileResponse, QuizFetchResponse, QuestionResponse, QuizOption, AnswerPayload, QuizInitRequest, AdaptiveQuestionResponse, AdaptiveAnswerResponse
from app.api.deps import get_current_user
from app.core.redis import cache
from app.services.llm_service import llm_service
from app.services.worker import grade_quiz_session
from datetime import datetime, timedelta
import uuid
import asyncio

router = APIRouter()

# Global log for debugging
print("DEBUG: Climbing API endpoints loaded")

@router.post("/profile/preferences")
def update_preferences(
    prefs: PreferencesUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == current_user.id).first()
    if not profile:
        profile = ClimbingProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    profile.primary_discipline = prefs.primary_discipline
    profile.current_grade = prefs.current_grade
    profile.indoor_vs_outdoor = prefs.indoor_vs_outdoor
    profile.goal = prefs.goal
    
    if not profile.radar_chart:
        profile.radar_chart = {"Safety": 0, "Technique": 0, "Local Beta": 0, "Rope Skills": 0, "Training Science": 0}
    
    timeline_event = ProfileTimeline(
        profile_id=profile.id,
        event_type="onboarding",
        delta="profile_initialized",
        state_snapshot=profile.radar_chart
    )
    db.add(timeline_event)
    
    current_user.onboarding_completed = True
    db.add(current_user)
    db.commit()
    cache.delete(f"profile:{current_user.id}")
    
    return {"status": "success", "data": {"profile_id": profile.id, "timeline_entry_id": timeline_event.id}}

@router.post("/quiz/init", response_model=AdaptiveQuestionResponse)
async def init_adaptive_quiz(
    request: QuizInitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz_session = QuizSession(
        user_id=current_user.id,
        status="pending",
        selected_keywords=request.keywords,
        is_generating=True
    )
    db.add(quiz_session)
    db.commit()
    db.refresh(quiz_session)
    
    try:
        profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == current_user.id).first()
        user_prefs = {
            "discipline": profile.primary_discipline,
            "grade": profile.current_grade,
            "indoor_vs_outdoor": profile.indoor_vs_outdoor
        } if profile else {}
        
        async with asyncio.timeout(90.0):
            generated_q = await llm_service.generate_adaptive_question(user_prefs, request.keywords)
        
        new_q = Question(
            category=generated_q.get("category", "General"),
            primary_topics=generated_q.get("primary_topics", []),
            secondary_topics=generated_q.get("secondary_topics", []),
            text=generated_q.get("text", "Question text?"),
            image_url=generated_q.get("image_url"),
            sources=generated_q.get("sources") or [],
            question_type="multiple_choice"
        )
        db.add(new_q)
        db.flush()
        
        choices = []
        for choice_data in generated_q.get("choices", []):
            c = Choice(
                question_id=new_q.id,
                text=choice_data.get("text", "?"),
                is_correct=choice_data.get("is_correct", False),
                explanation=choice_data.get("explanation", "")
            )
            db.add(c)
            choices.append(c)
            
        quiz_session.status = "active"
        quiz_session.is_generating = False
        quiz_session.current_question_id = new_q.id
        db.commit()
        
        return AdaptiveQuestionResponse(
            session_id=quiz_session.id,
            status="ongoing",
            question=QuestionResponse(
                id=new_q.id,
                category=new_q.category,
                primary_topics=new_q.primary_topics,
                secondary_topics=new_q.secondary_topics,
                text=new_q.text,
                image_url=new_q.image_url,
                sources=new_q.sources,
                options=[QuizOption(id=c.id, text=c.text) for c in choices]
            )
        )
    except (asyncio.TimeoutError, Exception) as e:
        db.delete(quiz_session)
        db.commit()
        raise HTTPException(status_code=504 if isinstance(e, asyncio.TimeoutError) else 500, detail=str(e))

@router.post("/quiz/{session_id}/answer", response_model=AdaptiveAnswerResponse)
async def submit_adaptive_answer(
    session_id: str,
    payload: AnswerPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz_session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.user_id == current_user.id).first()
    if not quiz_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if quiz_session.status != "active" or quiz_session.is_generating:
        raise HTTPException(status_code=400, detail="Session locked or completed")
    
    quiz_session.is_generating = True
    db.commit()
    
    try:
        print(f"DEBUG: Processing answer for session {session_id}, question {payload.question_id}")
        choice = db.query(Choice).filter(Choice.id == payload.selected_option_id, Choice.question_id == payload.question_id).first()
        if not choice:
            print(f"DEBUG: Choice {payload.selected_option_id} not found for question {payload.question_id}")
            quiz_session.is_generating = False
            db.commit()
            raise HTTPException(status_code=404, detail="Answer not found")
            
        is_correct = choice.is_correct
        correct_choice = db.query(Choice).filter(Choice.question_id == payload.question_id, Choice.is_correct == True).first()
        
        # PERSIST ANSWER LOG
        answer_log = AnswerLog(
            user_id=current_user.id,
            session_id=session_id,
            question_id=payload.question_id,
            choice_id=payload.selected_option_id,
            is_correct=is_correct
        )
        db.add(answer_log)
        db.flush()
        
        # Get actual history from DB
        history_logs = db.query(AnswerLog).filter(AnswerLog.session_id == session_id).all()
        history = []
        for log in history_logs:
            if log.question:
                history.append({"question": log.question.text, "category": log.question.category, "is_correct": log.is_correct})
            else:
                print(f"WARNING: AnswerLog {log.id} has no associated question!")
        
        print(f"DEBUG: Quiz history length: {len(history)}")
        
        should_conclude = await llm_service.should_conclude_quiz(history)
        
        if should_conclude:
            quiz_session.status = "completed"
            quiz_session.is_generating = False
            
            profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == current_user.id).first()
            if profile:
                profile.status = "updating"
            
            print(f"DEBUG: Concluding quiz session {session_id}")
            db.commit()
            
            # Use BackgroundTasks for processing
            background_tasks.add_task(grade_quiz_session, session_id)
            
            return AdaptiveAnswerResponse(
                status="completed",
                is_correct=is_correct,
                correct_option_id=correct_choice.id if correct_choice else "",
                explanation=choice.explanation if is_correct else (correct_choice.explanation if correct_choice else "")
            )
        else:
            profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == current_user.id).first()
            user_prefs = {"discipline": profile.primary_discipline, "grade": profile.current_grade} if profile else {}
            print(f"DEBUG: Generating next adaptive question for session {session_id}")
            next_q_data = await llm_service.generate_adaptive_question(user_prefs, quiz_session.selected_keywords, history)
            print(f"DEBUG: Next question data received: {next_q_data.keys()}")
            
            new_q = Question(
                category=next_q_data.get("category", "Adaptive"),
                primary_topics=next_q_data.get("primary_topics", []),
                secondary_topics=next_q_data.get("secondary_topics", []),
                text=next_q_data.get("text", ""),
                image_url=next_q_data.get("image_url"),
                sources=next_q_data.get("sources") or []
            )
            db.add(new_q)
            db.flush()
            
            choices = []
            for i, cd in enumerate(next_q_data.get("choices", [])):
                # Robustly handle choice data
                is_correct_val = cd.get("is_correct")
                if isinstance(is_correct_val, str):
                    is_correct_val = is_correct_val.lower() == "true"
                
                c = Choice(
                    question_id=new_q.id, 
                    text=cd.get("text", f"Option {i+1}"), 
                    is_correct=bool(is_correct_val), 
                    explanation=cd.get("explanation", "")
                )
                db.add(c)
                choices.append(c)
                
            print(f"DEBUG: Created {len(choices)} choices for next question")
            quiz_session.is_generating = False
            quiz_session.current_question_id = new_q.id
            db.commit()
            
            return AdaptiveAnswerResponse(
                status="ongoing",
                is_correct=is_correct,
                correct_option_id=correct_choice.id if correct_choice else "",
                explanation=choice.explanation if is_correct else (correct_choice.explanation if correct_choice else ""),
                next_question=QuestionResponse(
                    id=new_q.id,
                    category=new_q.category,
                    primary_topics=new_q.primary_topics,
                    secondary_topics=new_q.secondary_topics,
                    text=new_q.text,
                    image_url=new_q.image_url,
                    sources=new_q.sources,
                    options=[QuizOption(id=c.id, text=c.text) for c in choices]
                )
            )
            
    except Exception as e:
        print(f"ERROR in submit_adaptive_answer: {str(e)}")
        import traceback
        traceback.print_exc()
        quiz_session.is_generating = False
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quiz/{session_id}", response_model=AdaptiveQuestionResponse)
def get_adaptive_quiz_state(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz_session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.user_id == current_user.id).first()
    if not quiz_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if quiz_session.status == "completed":
        return AdaptiveQuestionResponse(session_id=session_id, status="completed", question=None)
    
    if not quiz_session.current_question:
        raise HTTPException(status_code=400, detail="No active question for this session")

    return AdaptiveQuestionResponse(
        session_id=session_id,
        status="ongoing",
        question=QuestionResponse(
            id=quiz_session.current_question.id,
            category=quiz_session.current_question.category,
            primary_topics=quiz_session.current_question.primary_topics,
            secondary_topics=quiz_session.current_question.secondary_topics,
            text=quiz_session.current_question.text,
            image_url=quiz_session.current_question.image_url,
            sources=quiz_session.current_question.sources,
            options=[QuizOption(id=c.id, text=c.text) for c in quiz_session.current_question.choices]
        )
    )

@router.get("/profile", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cache_key = f"profile:{current_user.id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return {"status": "success", "data": cached_data, "source": "cache"}

    profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    timeline_events = db.query(ProfileTimeline).filter(ProfileTimeline.profile_id == profile.id).order_by(ProfileTimeline.date.desc()).limit(5).all()
    
    profile_data = {
        "user_id": current_user.id,
        "status": profile.status,
        "preferences": {
            "primary_discipline": profile.primary_discipline,
            "current_grade": profile.current_grade,
            "indoor_vs_outdoor": profile.indoor_vs_outdoor,
            "goal": profile.goal
        },
        "radar_chart": profile.radar_chart,
        "recent_timeline_events": [
            {"date": e.date.isoformat(), "type": e.event_type, "delta": e.delta} for e in timeline_events
        ]
    }
    
    cache.set(cache_key, profile_data, expire_seconds=3600)
    return {"status": "success", "data": profile_data, "source": "database"}

@router.get("/quiz/static")
def get_static_quiz(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_questions = db.query(Question).all()
    questions = []
    for q in db_questions:
        options = [QuizOption(id=c.id, text=c.text) for c in q.choices]
        questions.append(
            QuestionResponse(
                id=q.id,
                category=q.category,
                text=q.text,
                image_url=q.image_url,
                sources=q.sources,
                type=q.question_type or "multiple_choice",
                options=options
            )
        )
    session_id = str(uuid.uuid4())
    return {"status": "success", "data": {"session_id": session_id, "total_questions": len(questions), "questions": questions}}

@router.post("/quiz/static/{session_id}/answer")
def submit_answer(
    session_id: str, 
    payload: AnswerPayload, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    choice = db.query(Choice).filter(Choice.id == payload.selected_option_id, Choice.question_id == payload.question_id).first()
    if not choice:
        raise HTTPException(status_code=404, detail="Choice or Question not found")
    
    is_correct = choice.is_correct
    correct_choice = db.query(Choice).filter(Choice.question_id == payload.question_id, Choice.is_correct == True).first()
    
    if is_correct:
         profile = db.query(ClimbingProfile).filter(ClimbingProfile.user_id == current_user.id).first()
         if profile:
              question = db.query(Question).filter(Question.id == payload.question_id).first()
              category = question.category.capitalize() if question else "Safety"
              if not profile.radar_chart:
                  profile.radar_chart = {"Safety": 0, "Technique": 0, "Local Beta": 0}
              current_score = profile.radar_chart.get(category, 0)
              profile.radar_chart[category] = min(100, current_score + 10)
              from sqlalchemy.orm.attributes import flag_modified
              flag_modified(profile, "radar_chart")
              event = ProfileTimeline(profile_id=profile.id, event_type="quiz_answer", delta=f"correct_answer_{category}", state_snapshot=profile.radar_chart)
              db.add(event)
              db.commit()
              cache.delete(f"profile:{current_user.id}")

    return {
        "status": "success",
        "data": {
            "is_correct": is_correct,
            "correct_option_id": correct_choice.id if correct_choice else None,
            "explanation": choice.explanation if is_correct else (correct_choice.explanation if correct_choice else ""),
            "knowledge_nodes_updated": [f"{choice.question.category}_mastery"] if is_correct else []
        }
    }
