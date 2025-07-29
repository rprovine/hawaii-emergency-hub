from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional

from app.services.translation_service import TranslationService

router = APIRouter()

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "haw", "name": "ʻŌlelo Hawaiʻi (Hawaiian)"},
            {"code": "ja", "name": "日本語 (Japanese)"},
            {"code": "ko", "name": "한국어 (Korean)"},
            {"code": "zh", "name": "中文 (Chinese)"},
            {"code": "tl", "name": "Tagalog (Filipino)"}
        ]
    }

@router.get("/translate")
async def translate_text(
    text: str = Query(..., description="Text to translate"),
    target_lang: str = Query(..., description="Target language code"),
    category: Optional[str] = Query(None, description="Category for context")
):
    """Translate text to target language"""
    
    if target_lang not in TranslationService.get_supported_languages():
        raise HTTPException(status_code=400, detail=f"Language {target_lang} not supported")
    
    translated = TranslationService.translate(text, target_lang, category)
    
    return {
        "original": text,
        "translated": translated,
        "language": target_lang,
        "category": category
    }

@router.get("/emergency-phrases/{lang}")
async def get_emergency_phrases(lang: str):
    """Get all emergency phrases in specified language"""
    
    if lang not in TranslationService.get_supported_languages():
        raise HTTPException(status_code=400, detail=f"Language {lang} not supported")
    
    phrases = TranslationService.get_emergency_phrases(lang)
    
    return {
        "language": lang,
        "phrases": phrases
    }

@router.post("/translate-alert")
async def translate_alert(
    alert_data: dict,
    target_languages: List[str] = Query(..., description="Target language codes")
):
    """Translate an alert to multiple languages"""
    
    # Validate languages
    supported = TranslationService.get_supported_languages()
    invalid = [lang for lang in target_languages if lang not in supported]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unsupported languages: {invalid}")
    
    translations = {}
    for lang in target_languages:
        translations[lang] = TranslationService.translate_alert(alert_data, lang)
    
    return {
        "original": alert_data,
        "translations": translations
    }

@router.post("/format-notification")
async def format_multilingual_notification(
    message: str = Query(..., description="Message in English"),
    severity: str = Query(..., description="Alert severity"),
    alert_type: str = Query(..., description="Type of alert"),
    languages: List[str] = Query(..., description="Target language codes")
):
    """Format a notification in multiple languages"""
    
    # Validate languages
    supported = TranslationService.get_supported_languages()
    invalid = [lang for lang in languages if lang not in supported]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unsupported languages: {invalid}")
    
    notifications = TranslationService.format_multilingual_notification(
        message, severity, alert_type, languages
    )
    
    return {
        "message": message,
        "notifications": notifications
    }