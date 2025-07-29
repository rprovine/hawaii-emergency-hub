import json
import logging
from typing import Dict, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Translation data for emergency alerts
TRANSLATIONS = {
    "en": {
        "alert_types": {
            "tsunami": "Tsunami Warning",
            "earthquake": "Earthquake Alert",
            "volcano": "Volcanic Activity",
            "hurricane": "Hurricane Warning",
            "flood": "Flood Warning",
            "fire": "Fire Alert",
            "evacuation": "Evacuation Notice"
        },
        "severity": {
            "extreme": "Extreme",
            "severe": "Severe",
            "moderate": "Moderate",
            "minor": "Minor"
        },
        "actions": {
            "evacuate": "Evacuate immediately",
            "shelter": "Seek shelter",
            "avoid_area": "Avoid the area",
            "stay_informed": "Stay informed",
            "prepare": "Prepare for impact"
        },
        "messages": {
            "new_alert": "New emergency alert",
            "alert_updated": "Alert updated",
            "alert_cancelled": "Alert cancelled",
            "safe_now": "Area is now safe"
        }
    },
    "haw": {  # Hawaiian
        "alert_types": {
            "tsunami": "Hōʻike Kai Koo",
            "earthquake": "Hōʻike ʻŌlaʻi",
            "volcano": "Hana Pele",
            "hurricane": "Hōʻike Makani Pāhili",
            "flood": "Hōʻike Wai Halana",
            "fire": "Hōʻike Ahi",
            "evacuation": "Hōʻike Hoʻokuʻu"
        },
        "severity": {
            "extreme": "Piha Loa",
            "severe": "Koʻikoʻi",
            "moderate": "ʻŌkole",
            "minor": "Liʻiliʻi"
        },
        "actions": {
            "evacuate": "E hoʻokuʻu koke",
            "shelter": "E ʻimi i wahi pale",
            "avoid_area": "E alo i ka wahi",
            "stay_informed": "E hoʻolohe pono",
            "prepare": "E hoʻomākaukau"
        },
        "messages": {
            "new_alert": "Hōʻike pilikia hou",
            "alert_updated": "Ua hoʻololi ʻia ka hōʻike",
            "alert_cancelled": "Ua hoʻopau ʻia ka hōʻike",
            "safe_now": "Palekana ka wahi"
        }
    },
    "ja": {  # Japanese
        "alert_types": {
            "tsunami": "津波警報",
            "earthquake": "地震警報",
            "volcano": "火山活動",
            "hurricane": "ハリケーン警報",
            "flood": "洪水警報",
            "fire": "火災警報",
            "evacuation": "避難指示"
        },
        "severity": {
            "extreme": "非常事態",
            "severe": "重大",
            "moderate": "中程度",
            "minor": "軽微"
        },
        "actions": {
            "evacuate": "直ちに避難してください",
            "shelter": "避難所を探してください",
            "avoid_area": "その地域を避けてください",
            "stay_informed": "情報を確認してください",
            "prepare": "準備してください"
        },
        "messages": {
            "new_alert": "新しい緊急警報",
            "alert_updated": "警報が更新されました",
            "alert_cancelled": "警報が解除されました",
            "safe_now": "現在安全です"
        }
    },
    "ko": {  # Korean
        "alert_types": {
            "tsunami": "쓰나미 경보",
            "earthquake": "지진 경보",
            "volcano": "화산 활동",
            "hurricane": "허리케인 경보",
            "flood": "홍수 경보",
            "fire": "화재 경보",
            "evacuation": "대피 지시"
        },
        "severity": {
            "extreme": "극도",
            "severe": "심각",
            "moderate": "보통",
            "minor": "경미"
        },
        "actions": {
            "evacuate": "즉시 대피하십시오",
            "shelter": "대피소를 찾으십시오",
            "avoid_area": "해당 지역을 피하십시오",
            "stay_informed": "정보를 확인하십시오",
            "prepare": "준비하십시오"
        },
        "messages": {
            "new_alert": "새로운 비상 경보",
            "alert_updated": "경보가 업데이트되었습니다",
            "alert_cancelled": "경보가 해제되었습니다",
            "safe_now": "현재 안전합니다"
        }
    },
    "zh": {  # Chinese (Simplified)
        "alert_types": {
            "tsunami": "海啸警报",
            "earthquake": "地震警报",
            "volcano": "火山活动",
            "hurricane": "飓风警报",
            "flood": "洪水警报",
            "fire": "火灾警报",
            "evacuation": "疏散通知"
        },
        "severity": {
            "extreme": "极端",
            "severe": "严重",
            "moderate": "中等",
            "minor": "轻微"
        },
        "actions": {
            "evacuate": "立即疏散",
            "shelter": "寻找避难所",
            "avoid_area": "避开该地区",
            "stay_informed": "保持关注",
            "prepare": "做好准备"
        },
        "messages": {
            "new_alert": "新的紧急警报",
            "alert_updated": "警报已更新",
            "alert_cancelled": "警报已取消",
            "safe_now": "现在安全"
        }
    },
    "tl": {  # Tagalog
        "alert_types": {
            "tsunami": "Babala sa Tsunami",
            "earthquake": "Babala sa Lindol",
            "volcano": "Aktibidad ng Bulkan",
            "hurricane": "Babala sa Bagyo",
            "flood": "Babala sa Baha",
            "fire": "Babala sa Sunog",
            "evacuation": "Abiso ng Paglikas"
        },
        "severity": {
            "extreme": "Lubhang Grabe",
            "severe": "Malubha",
            "moderate": "Katamtaman",
            "minor": "Bahagya"
        },
        "actions": {
            "evacuate": "Lumikas kaagad",
            "shelter": "Humanap ng kanlungan",
            "avoid_area": "Iwasan ang lugar",
            "stay_informed": "Manatiling may alam",
            "prepare": "Maghanda"
        },
        "messages": {
            "new_alert": "Bagong emergency alert",
            "alert_updated": "Na-update ang alert",
            "alert_cancelled": "Kinansela ang alert",
            "safe_now": "Ligtas na ang lugar"
        }
    }
}


class TranslationService:
    """Service for translating emergency alerts to multiple languages"""
    
    @staticmethod
    def get_supported_languages() -> List[str]:
        """Get list of supported language codes"""
        return list(TRANSLATIONS.keys())
    
    @staticmethod
    def translate(text: str, target_lang: str, category: str = None) -> str:
        """
        Translate text to target language
        
        Args:
            text: Text to translate
            target_lang: Target language code (en, haw, ja, ko, zh, tl)
            category: Optional category for context (alert_types, severity, actions, messages)
        
        Returns:
            Translated text or original if translation not found
        """
        if target_lang not in TRANSLATIONS:
            logger.warning(f"Language {target_lang} not supported")
            return text
        
        lang_data = TRANSLATIONS[target_lang]
        
        # If category is specified, look in that category first
        if category and category in lang_data:
            category_data = lang_data[category]
            # Try to find exact match (case-insensitive)
            for key, value in category_data.items():
                if key.lower() == text.lower():
                    return value
        
        # Search through all categories
        for cat_name, cat_data in lang_data.items():
            if isinstance(cat_data, dict):
                for key, value in cat_data.items():
                    if key.lower() == text.lower():
                        return value
        
        # If no translation found, return original
        return text
    
    @staticmethod
    def translate_alert(alert_data: Dict, target_lang: str) -> Dict:
        """
        Translate an entire alert object
        
        Args:
            alert_data: Alert dictionary with fields like type, severity, title, description
            target_lang: Target language code
        
        Returns:
            Translated alert dictionary
        """
        if target_lang == "en":
            return alert_data
        
        translated = alert_data.copy()
        
        # Translate alert type
        if "type" in translated:
            translated["type_translated"] = TranslationService.translate(
                translated["type"], target_lang, "alert_types"
            )
        
        # Translate severity
        if "severity" in translated:
            translated["severity_translated"] = TranslationService.translate(
                translated["severity"], target_lang, "severity"
            )
        
        # Add language tag
        translated["language"] = target_lang
        
        # Note: Full text translation would require external API
        # For now, we provide category translations and keep original text
        translated["translation_note"] = "Category translations provided. Full text translation requires external service."
        
        return translated
    
    @staticmethod
    def get_emergency_phrases(lang: str) -> Dict[str, str]:
        """Get common emergency phrases in specified language"""
        if lang not in TRANSLATIONS:
            lang = "en"
        
        result = {}
        lang_data = TRANSLATIONS[lang]
        
        # Flatten all categories into one dictionary
        for category, phrases in lang_data.items():
            if isinstance(phrases, dict):
                for key, value in phrases.items():
                    result[f"{category}.{key}"] = value
        
        return result
    
    @staticmethod
    def format_multilingual_notification(
        message: str,
        severity: str,
        alert_type: str,
        languages: List[str]
    ) -> Dict[str, str]:
        """
        Format a notification in multiple languages
        
        Args:
            message: Original message in English
            severity: Alert severity level
            alert_type: Type of alert
            languages: List of language codes to include
        
        Returns:
            Dictionary with language code as key and formatted message as value
        """
        notifications = {}
        
        for lang in languages:
            if lang not in TRANSLATIONS:
                continue
            
            if lang == "en":
                notifications[lang] = f"[{alert_type.upper()}] {message}"
            else:
                # Get translated components
                type_trans = TranslationService.translate(alert_type, lang, "alert_types")
                sev_trans = TranslationService.translate(severity, lang, "severity")
                
                # Format notification with available translations
                notifications[lang] = f"[{type_trans}] ({sev_trans}) {message}"
        
        return notifications