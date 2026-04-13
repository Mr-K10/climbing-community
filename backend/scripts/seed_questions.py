import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import app modules
# Absolute path to backend
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BACKEND_DIR)

from app.core.database import SessionLocal
from app.models.models import Question, Choice

def seed_questions():
    db: Session = SessionLocal()
    
    # Check if questions already exist to avoid duplicates
    if db.query(Question).count() > 0:
        print("Questions already exist in the database. Skipping seeding.")
        db.close()
        return

    questions_data = [
        # SAFETY (7 questions)
        {
            "category": "safety",
            "text": "What is the standard knot for tying into your climbing harness?",
            "image_url": "/quiz_images/figure_eight.png",
            "choices": [
                {"text": "Square Knot", "is_correct": False},
                {"text": "Figure-Eight Follow-Through", "is_correct": True, "explanation": "The Figure-Eight is the most secure and universally accepted knot for tying into a climbing harness."},
                {"text": "Bowline Knot", "is_correct": False},
                {"text": "Slip Knot", "is_correct": False}
            ]
        },
        {
            "category": "safety",
            "text": "What is 'Back-clipping' in sport climbing?",
            "image_url": "/quiz_images/back_clipping.png",
            "choices": [
                {"text": "Clipping into two different quickdraws at once", "is_correct": False},
                {"text": "Clipping the quickdraw into the bolt backward", "is_correct": False},
                {"text": "Clipping the rope so it runs back toward the wall instead of out toward the climber", "is_correct": True, "explanation": "Back-clipping is dangerous because a fall can unclip the rope from the carabiner."},
                {"text": "Clipping the rope with your foot above the quickdraw", "is_correct": False}
            ]
        },
        {
            "category": "safety",
            "text": "When spotting a boulderer, what is your primary goal?",
            "choices": [
                {"text": "To catch the climber completely", "is_correct": False},
                {"text": "To guide the climber's fall onto the mats and keep them upright", "is_correct": True, "explanation": "A spotter's role is to ensure the climber lands on the pads and prevents their head from hitting the ground."},
                {"text": "To push the climber toward the next hold", "is_correct": False},
                {"text": "To move the crash pads while they fall", "is_correct": False}
            ]
        },
        {
            "category": "safety",
            "text": "What is 'Z-clipping'?",
            "choices": [
                {"text": "Clipping into three quickdraws in a row", "is_correct": False},
                {"text": "Clipping a quickdraw into the rope from below the previous one", "is_correct": True, "explanation": "Z-clipping occurs when you grab the rope from below your last clip and pull it up to the next bolt, creating extreme rope drag."},
                {"text": "Clipping the rope into a quickdraw using two hands", "is_correct": False},
                {"text": "Clipping the harness to the belay loop instead of the tie-in points", "is_correct": False}
            ]
        },
        {
             "category": "safety",
             "text": "What should be checked during a partner check before climbing?",
             "choices": [
                 {"text": "Knots, Harness, Belay device, and Rope ends", "is_correct": True, "explanation": "A thorough partner check includes verifying the climber's knot, the belayer's device setup, harness buckles, and a knot at the end of the rope."},
                 {"text": "Only the climber's knot", "is_correct": False},
                 {"text": "Only the belayer's device", "is_correct": False},
                 {"text": "Chalk bag and shoes", "is_correct": False}
             ]
        },
        {
            "category": "safety",
            "text": "What is a 'third hand' in rappelling?",
            "choices": [
                {"text": "A backup person holding the bottom of the rope", "is_correct": False},
                {"text": "A friction hitch (like a Prusik or Autoblock) used as a backup", "is_correct": True, "explanation": "A friction hitch acts as a backup that will automatically lock the rope if the rappeler loses control."},
                {"text": "An extra carabiner placed on the belay loop", "is_correct": False},
                {"text": "Holding the rope with both hands above the device", "is_correct": False}
            ]
        },
        {
            "category": "safety",
            "text": "In a lead fall, what is the standard belay technique to reduce impact?",
            "choices": [
                {"text": "Soft catch (jumping slightly as the climber falls)", "is_correct": True, "explanation": "A soft catch involves moving slightly with the climber as they fall to provide a gradual deceleration and reduce impact forces."},
                {"text": "Pulling the rope downward hard", "is_correct": False},
                {"text": "Locking the device and sitting down immediately", "is_correct": False},
                {"text": "Letting the rope slip through the hands", "is_correct": False}
            ]
        },
        # TECHNIQUE (7 questions)
        {
            "category": "technique",
            "text": "What is 'Flagging' in climbing movement?",
            "image_url": "/quiz_images/flagging.png",
            "choices": [
                {"text": "Shaking out your arm to rest", "is_correct": False},
                {"text": "Placing a leg against the wall for balance without standing on a hold", "is_correct": True, "explanation": "Flagging helps shift your center of gravity and prevents 'barn-dooring' away from the wall."},
                {"text": "Climb up a vertical crack using hand jams", "is_correct": False},
                {"text": "Using a finger to point to the next hold", "is_correct": False}
            ]
        },
        {
            "category": "technique",
            "text": "Which type of hold requires an open-hand grip and relies on friction?",
            "choices": [
                {"text": "Crimp", "is_correct": False},
                {"text": "Sloper", "is_correct": True, "explanation": "Slopers require maximum surface contact and rely on friction and precise body positioning."},
                {"text": "Jug", "is_correct": False},
                {"text": "Undercling", "is_correct": False}
            ]
        },
        {
            "category": "technique",
            "text": "What is 'Stemming'?",
            "choices": [
                {"text": "Pushing against two opposing walls or features", "is_correct": True, "explanation": "Stemming uses outward pressure from your limbs to bridge across a corner or chimney."},
                {"text": "Pulling yourself up using only one arm", "is_correct": False},
                {"text": "Standing on very small edges with your toes", "is_correct": False},
                {"text": "Jumping between two holds", "is_correct": False}
            ]
        },
        {
            "category": "technique",
            "text": "A move where you press down on a ledge or hold with your palm (like getting out of a pool) is called:",
            "choices": [
                {"text": "Dyno", "is_correct": False},
                {"text": "Smear", "is_correct": False},
                {"text": "Mantle", "is_correct": True, "explanation": "Mantling involves pressing down and extending your arm to push your torso up over a flat feature or ledge."},
                {"text": "Heel hook", "is_correct": False}
            ]
        },
        {
            "category": "technique",
            "text": "What is 'Smearing'?",
            "choices": [
                {"text": "Using friction by pressing your shoe directly against the rock", "is_correct": True, "explanation": "Smearing is the technique of using the friction of the climbing rubber directly on the rock face when no distinct footholds are present."},
                {"text": "Spreading chalk over the holds", "is_correct": False},
                {"text": "Climbing with both hands and feet on the same hold", "is_correct": False},
                {"text": "Jumping to a large hold", "is_correct": False}
            ]
        },
        {
            "category": "technique",
            "text": "What is a 'Dyno'?",
            "image_url": "/quiz_images/dyno.png",
            "choices": [
                {"text": "A very difficult climb with many crimps", "is_correct": False},
                {"text": "A dynamic jump move where all points of contact leave the wall", "is_correct": True, "explanation": "A dyno is an explosive move where momentum is used to reach a distant hold, often resulting in all contact with the wall being lost briefly."},
                {"text": "A slow, controlled movement over a crux", "is_correct": False},
                {"text": "Climbing horizontally across the wall", "is_correct": False}
            ]
        },
        {
            "category": "technique",
            "text": "Which grip is most effective on a 'Sidepull' hold?",
            "choices": [
                {"text": "Pulling directly downward", "is_correct": False},
                {"text": "Pulling horizontally across your body", "is_correct": True, "explanation": "Sidepulls are vertical or diagonal holds that require you to pull sideways, often by shifting your body weight to the opposite side."},
                {"text": "Pressing upward with your palm", "is_correct": False},
                {"text": "Using a heel hook above the hold", "is_correct": False}
            ]
        },
        # TERMINOLOGY & GEAR (6 questions)
        {
            "category": "terminology",
            "text": "What does 'Flash' mean in climbing?",
            "choices": [
                {"text": "Climbing a route very quickly", "is_correct": False},
                {"text": "Completing a route on your first try without falling", "is_correct": True, "explanation": "A flash is a successful ascent on the first attempt, regardless of whether you have received information or 'beta' beforehand."},
                {"text": "Climbing a route at night using a headlamp", "is_correct": False},
                {"text": "Using dynamic moves to reach the top", "is_correct": False}
            ]
        },
        {
            "category": "terminology",
            "text": "What is 'Beta' in climbing?",
            "choices": [
                {"text": "The difficulty rating of a climb", "is_correct": False},
                {"text": "Information or advice on how to successfully climb a route", "is_correct": True, "explanation": "Beta refers to any information about a climb, such as which holds to use, sequence of moves, or rest points."},
                {"text": "The type of rock the route is on", "is_correct": False},
                {"text": "The brand of climbing shoes you use", "is_correct": False}
            ]
        },
        {
            "category": "terminology",
            "text": "What is a 'Quickdraw'?",
            "choices": [
                {"text": "A type of climbing shoe", "is_correct": False},
                {"text": "Two carabiners connected by a short piece of webbing", "is_correct": True, "explanation": "Quickdraws are used in sport climbing to connect the climbing rope to the bolts in the rock."},
                {"text": "A tool used for cleaning holds", "is_correct": False},
                {"text": "A high-speed belay device", "is_correct": False}
            ]
        },
        {
            "category": "terminology",
            "text": "What is the 'Crux' of a climb?",
            "choices": [
                {"text": "The most difficult move or section of a route", "is_correct": True, "explanation": "The crux is the hardest part of the climb where most people are likely to fall."},
                {"text": "The very top of the climb", "is_correct": False},
                {"text": "The easiest section with large holds", "is_correct": False},
                {"text": "The section where you can safely rest", "is_correct": False}
            ]
        },
        {
            "category": "terminology",
            "text": "What does 'Redpoint' mean?",
            "choices": [
                {"text": "Climbing a route multiple times a day", "is_correct": False},
                {"text": "Successfully lead climbing a route without falling after previous practice", "is_correct": True, "explanation": "A redpoint is a successful lead ascent of a route after at least one previous attempt or practice session."},
                {"text": "Climbing a route on top-rope", "is_correct": False},
                {"text": "Climbing until you are completely exhausted", "is_correct": False}
            ]
        },
        {
            "category": "terminology",
            "text": "How does this platform represent climbing grades for Sport and Bouldering?",
            "choices": [
                {"text": "Single system (e.g., 6a or V3)", "is_correct": False},
                {"text": "Dual systems: French / YDS for Sport, and Font / V-Scale for Bouldering", "is_correct": True, "explanation": "To ensure global clarity, we use both major systems for all disciplines: French/YDS for roped climbing and Font/V-Scale for bouldering."},
                {"text": "Color-coded grades only", "is_correct": False},
                {"text": "Ewbank System only", "is_correct": False}
            ]
        }
    ]

    for q_data in questions_data:
        question = Question(
            category=q_data["category"],
            text=q_data["text"],
            image_url=q_data.get("image_url")
        )
        db.add(question)
        db.flush() # Flush to get the question ID
        
        for c_data in q_data["choices"]:
            choice = Choice(
                question_id=question.id,
                text=c_data["text"],
                is_correct=c_data["is_correct"],
                explanation=c_data.get("explanation")
            )
            db.add(choice)
            
    db.commit()
    print(f"Successfully seeded {len(questions_data)} questions.")
    db.close()

if __name__ == "__main__":
    seed_questions()
