import os
import json
import random
import asyncio
import uuid
from typing import List, Dict, Optional
from google import genai
from app.utils.llm_manager import llm_manager

class LLMService:
    def __init__(self):
        # We now delegate model and key management to llm_manager
        pass

    async def generate_adaptive_question(self, user_prefs: Dict, keywords: List[str], history: List[Dict] = []) -> Dict:
        # Use helper for robustness
        client, model, api_key = llm_manager.get_best_client(model_type="question")
        if not client or not model:
            print("Critically low on LLM resources, using mock fallback.")
            return self._get_mock_question(keywords)
        
        # Select Secondary Topic based on Strategy
        discipline = (user_prefs.get("discipline") or "sport").lower()
        secondary_topic = self._get_secondary_topic(discipline)
        
        history_str = json.dumps(history) if history else "Start of quiz."
        prompt = f"""
        You are a highly experienced climbing instructor. Generate a scenario-based question for a user with these preferences:
        {json.dumps(user_prefs)}
        
        PRIMARY FOCUS (Keywords): {", ".join(keywords)}
        SECONDARY FOCUS: {secondary_topic}
        
        Question Formula: Blend the PRIMARY FOCUS with the SECONDARY FOCUS into a realistic scenario. 
        - If the secondary focus is 'Local Beta', include context about the specific locations mentioned.
        - If the secondary focus is 'Physiology', focus on the physical impact of the move/scenario.
        - If the secondary focus is 'Ethics', include a social or environmental dilemma.
        
        Previous history: {history_str}
        
        Create a new, challenging question that tests deep knowledge, not just definitions.
        
        GRADING RULE: Whenever you mention climbing grades, you MUST use dual systems:
        - For Sport/Trad: use both French and Yosemite Decimal System (e.g., "7a / 5.11d").
        - For Bouldering: use both Fontainebleau and V-Scale (e.g., "7A / V6").
        
        Return strictly JSON with 4 distinct choices (1 correct, 3 incorrect):
        {{
            "category": "{secondary_topic}",
            "primary_topics": ["string", "string"],
            "secondary_topics": ["string"],
            "text": "string",
            "image_prompt": "string (A detailed prompt to generate an image)",
            "sources": [{{"title": "Web Page or Book Title", "url": "https://..."}}],
            "choices": [
                {{"text": "string", "is_correct": true, "explanation": "string"}},
                {{"text": "string", "is_correct": false, "explanation": "string"}},
                {{"text": "string", "is_correct": false, "explanation": "string"}},
                {{"text": "string", "is_correct": false, "explanation": "string"}}
            ]
        }}
        """
        
        try:
            print(f"Generating question with {model}...")
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt
            )
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            if "choices" in result and isinstance(result["choices"], list):
                random.shuffle(result["choices"])
            
            # Try image generation
            if not result.get("image_url") and result.get("image_prompt"):
                image_url = await self._generate_real_image(result["image_prompt"])
                if image_url:
                    result["image_url"] = image_url
            
            # Ensure topics are present
            if "primary_topics" not in result:
                result["primary_topics"] = keywords
            if "secondary_topics" not in result:
                result["secondary_topics"] = [secondary_topic]
            
            # Ensure sources is a list
            if not result.get("sources") or not isinstance(result.get("sources"), list):
                result["sources"] = []
            
            return result

        except Exception as e:
            err_msg = str(e).lower()
            if any(q in err_msg for q in ["429", "resource_exhausted", "quota", "rate limit"]):
                llm_manager.report_quota_failure(api_key, model)
            
            print(f"Question generation failed for model {model}: {e}. Retrying with next best...")
            # Recurse once if it failed, llm_manager will provide next best
            return await self.generate_adaptive_question(user_prefs, keywords, history)

    def _get_mock_question(self, keywords: List[str]) -> Dict:
        category = keywords[0].capitalize() if keywords else "Safety"
        fallback = {
            "category": category,
            "primary_topics": keywords,
            "secondary_topics": [category],
            "text": f"How do you safely verify a {category.lower()} anchor point?",
            "sources": [{"title": "American Alpine Club (AAC) - Anchor Verification Guide", "url": "https://americanalpineclub.org/"}],
            "choices": [
                {"text": "Apply outward and downward pressure (CORRECT)", "is_correct": True, "explanation": "Always test anchors in the direction of expected load."},
                {"text": "Just look at it", "is_correct": False, "explanation": "Visual check is insufficient."},
                {"text": "Ask a friend", "is_correct": False, "explanation": "You must verify your own safety."},
                {"text": "Trust the previous climber", "is_correct": False, "explanation": "Never trust existing gear without personal validation."}
            ]
        }
        random.shuffle(fallback["choices"])
        return fallback

    async def _generate_real_image(self, prompt: str) -> Optional[str]:
        client, model, api_key = llm_manager.get_best_client(model_type="image")
        if not client or not model:
            return None
            
        refined_prompt = f"Professional instructional climbing photography, 8k, photorealistic: {prompt}. High contrast, focus on technique, safe environment."
        
        try:
            print(f"Attempting image generation with {model}...")
            
            gen_func = getattr(client.models, "generate_image", None) or getattr(client.models, "generate_images", None)
            if not gen_func:
                raise AttributeError(f"SDK missing generate_image(s) on {type(client.models)}")
                
            response = await asyncio.to_thread(
                gen_func,
                model=model,
                prompt=refined_prompt,
                config={"number_of_images": 1}
            )
            
            if response.generated_images:
                import base64
                from io import BytesIO
                from PIL import Image
                
                img_obj = response.generated_images[0]
                img_b64 = None
                
                # Extract image data
                if hasattr(img_obj, 'image') and img_obj.image is not None:
                    # If it's already a PIL image or similar
                    pil_img = img_obj.image
                    buffered = BytesIO()
                    # Optimize before base64
                    pil_img.save(buffered, format="JPEG", quality=70, optimize=True)
                    img_b64 = base64.b64encode(buffered.getvalue()).decode()
                elif hasattr(img_obj, 'image_bytes'):
                    # If it's raw bytes, wrap in PIL for optimization
                    pil_img = Image.open(BytesIO(img_obj.image_bytes))
                    buffered = BytesIO()
                    pil_img.save(buffered, format="JPEG", quality=70, optimize=True)
                    img_b64 = base64.b64encode(buffered.getvalue()).decode()
                
                if img_b64:
                    print(f"Success! Image generated with {model} and converted to optimized base64.")
                    return f"data:image/jpeg;base64,{img_b64}"
                
        except Exception as e:
            err_msg = str(e).lower()
            if any(q in err_msg for q in ["429", "resource_exhausted", "quota", "rate limit"]):
                llm_manager.report_quota_failure(api_key, model)
            print(f"Image generation failed for {model}: {e}")
            return None
                
        return None

    async def should_conclude_quiz(self, history: List[Dict]) -> bool:
        if len(history) < 3:
            return False
        if len(history) >= 8:
            return True
            
        client, model, api_key = llm_manager.get_best_client(model_type="question")
        if not client:
            return len(history) >= 5
            
        prompt = f"""
        Based on this quiz history, have we accurately assessed the user's knowledge level in the selected topics?
        History: {json.dumps(history)}
        
        Return strictly JSON: {{"conclude": boolean}}
        """
        
        try:
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt
            )
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            return json.loads(text).get("conclude", len(history) >= 5)
        except Exception as e:
            print(f"Quiz conclusion check failed: {e}")
            return len(history) >= 5

    async def extract_knowledge_delta(self, history: List[Dict], current_profile: Dict) -> Dict:
        client, model, api_key = llm_manager.get_best_client(model_type="question")
        if not client:
            return {
                "summary": "Profile updated based on quiz performance.",
                "radar_chart_updates": current_profile.get("radar_chart", {}) 
            }
            
        prompt = f"""
        Analyze this quiz performance against the user's current profile.
        History: {json.dumps(history)}
        Current Profile: {json.dumps(current_profile)}
        
        Identify:
        1. Performance improvements or degraded areas.
        2. Synthesize a findings summary (max 2 sentences).
        3. Suggest updated values for the Radar Chart (Safety, Technique, Local Beta, Rope Skills, Training Science, Mindset) on a scale of 0-100.
        
        GRADING RULE: If you mention specific grades in your summary, you MUST use dual systems (French/YDS for sport/trad, Font/V-Scale for bouldering).
        
        Return strictly JSON:
        {{
            "summary": "string",
            "radar_chart_updates": {{ "Category": value, ... }}
        }}
        """
        
        try:
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt
            )
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            if "radar_chart_updates" not in data:
                data["radar_chart_updates"] = {}
            return data
        except Exception as e:
            print(f"Knowledge delta extraction failed: {e}")
            return {"summary": "Quiz completed. Performance analyzed.", "radar_chart_updates": {}}

    def  _get_secondary_topic(self, discipline: str) -> str:
        # Finalized Topic Mix Strategy
        if discipline == "bouldering":
            weights = {
                "Technique": 25,
                "Gear & Hardware": 5,
                "Terminology & Beta": 15,
                "Physiology & Recovery": 10,
                "Local Beta / Local Trivia": 20,
                "World Trivia / History": 20,
                "Environmental Ethics": 5
            }
        else: # Sport, Trad, General
            weights = {
                "Technique": 15,
                "Gear & Hardware": 20,
                "Terminology & Beta": 15,
                "Physiology & Recovery": 10,
                "Local Beta / Local Trivia": 20,
                "World Trivia / History": 15,
                "Environmental Ethics": 5
            }
        
        topics = list(weights.keys())
        counts = list(weights.values())
        return random.choices(topics, weights=counts, k=1)[0]

llm_service = LLMService()
