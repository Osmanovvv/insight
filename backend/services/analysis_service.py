"""
Insight IS — AI Analysis Service
Sentiment analysis and impact scoring using Google Gemini AI.
"""

import json
from typing import Optional
from loguru import logger
from google import genai

from settings.settings import settings

# Configure Gemini client if key is provided
if settings.gemini_api_key:
    client = genai.Client(api_key=settings.gemini_api_key)
    # Using a fast, cost-effective model for this kind of task
    _MODEL_ID = "gemini-2.5-flash"
else:
    client = None
    _MODEL_ID = ""

# Fallback basic heuristic if API fails or key is missing
_POSITIVE = ["рост", "прибыль", "рекорд", "превысил", "позитивный", "growth", "profit", "bullish"]
_NEGATIVE = ["падение", "убыток", "снижение", "кризис", "drop", "loss", "decline", "bearish"]
_HIGH_IMPACT = ["ФРС", "ЦБ", "fed", "war", "война", "санкции", "запрет"]


def _fallback_analysis(text: str) -> dict:
    """Basic keyword analysis if AI fails."""
    text_lower = text.lower()
    
    pos_hits = sum(1 for kw in _POSITIVE if kw in text_lower)
    neg_hits = sum(1 for kw in _NEGATIVE if kw in text_lower)
    total = pos_hits + neg_hits
    
    sentiment = "neutral"
    raw_score = 0.0
    if total > 0:
        if pos_hits > neg_hits:
            sentiment = "positive"
            raw_score = pos_hits / total
        elif neg_hits > pos_hits:
            sentiment = "negative"
            raw_score = -(neg_hits / total)
            
    high_hits = sum(1 for kw in _HIGH_IMPACT if kw in text_lower)
    impact = "high" if high_hits >= 1 or total >= 5 else ("medium" if total >= 2 else "low")
    impact_score = 0.8 if impact == "high" else (0.4 + total * 0.05 if impact == "medium" else 0.1)
    
    if sentiment == "positive":
        rec = "Новость позитивна для рынка — стоит рассмотреть покупку активов соответствующего сектора."
    elif sentiment == "negative":
        rec = "Новость несёт негативный сигнал — рекомендуется соблюдать осторожность и сократить позиции в рискованных активах."
    else:
        rec = "Новость нейтральна — существенных изменений в портфеле не требуется, следите за развитием ситуации."
    return {
        "sentiment": sentiment,
        "sentiment_score": round(raw_score, 3),
        "impact": impact,
        "impact_score": min(round(impact_score, 3), 1.0),
        "confidence": min(0.5 + total * 0.05, 0.95),
        "summary": rec,
    }


def analyze_article(title: str, content: Optional[str] = None) -> dict:
    """
    Analyse an article using Google Gemini AI.
    Returns: {sentiment, impact, confidence, summary, sentiment_score, impact_score}
    """
    text = f"Title: {title}\n\nContent: {content or ''}"

    if not client:
        logger.warning("Gemini API key not found. Using fallback analysis.")
        return _fallback_analysis(text)

    prompt = f"""
Ты — финансовый аналитик. Проанализируй новость и дай краткую инвестиционную рекомендацию.
Отвечай ТОЛЬКО валидным JSON-объектом строго следующей структуры (без markdown-оберток):
{{
  "sentiment": "positive" | "negative" | "neutral",
  "sentiment_score": число от -1.0 (самый негативный) до 1.0 (самый позитивный),
  "impact": "high" | "medium" | "low",
  "impact_score": число от 0.0 до 1.0 (сила влияния на рынок),
  "confidence": число от 0.0 до 1.0 (уверенность в оценке),
  "summary": "1-2 конкретные инвестиционные рекомендации на русском языке — какие активы, сектора или инструменты стоит рассмотреть или избегать в связи с этой новостью. Например: если нефть дорожает — присмотреться к акциям нефтяных компаний. Не пересказывай новость, давай только практический совет для портфеля."
}}

Текст новости:
{text}
"""

    try:
        response = client.models.generate_content(
            model=_MODEL_ID,
            contents=prompt,
        )
        # Extract JSON from the response (sometimes Gemini wraps it in markdown backticks)
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        ai_data = json.loads(result_text)
        
        # Ensure values are rounded properly
        return {
            "sentiment": ai_data.get("sentiment", "neutral"),
            "sentiment_score": round(float(ai_data.get("sentiment_score", 0.0)), 3),
            "impact": ai_data.get("impact", "low"),
            "impact_score": round(float(ai_data.get("impact_score", 0.1)), 3),
            "confidence": round(float(ai_data.get("confidence", 0.8)), 3),
            "summary": ai_data.get("summary", text[:200].strip()),
        }

    except Exception as e:
        logger.error(f"Gemini API analysis failed: {e}. Falling back to heuristics.")
        return _fallback_analysis(text)


analysis_service = type("AnalysisService", (), {"analyze": staticmethod(analyze_article)})()
