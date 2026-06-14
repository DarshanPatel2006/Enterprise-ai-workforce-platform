# backend/app/config.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file (c:/project/backend/.env)
load_dotenv()

class Settings:
    PROJECT_ROOT: str = "c:/project"
    
    # Database URL: SQLite locally by default, override for MySQL in production
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{PROJECT_ROOT}/workforce.db")
    
    # JWT Config
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-enterprise-workforce-key-2026-xyz")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # AI Providers API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    
    @property
    def simulate_ai(self) -> bool:
        # If no Gemini, Groq, or OpenRouter keys are present, fall back to mock AI simulation
        return not (self.GEMINI_API_KEY or self.GROQ_API_KEY or self.OPENROUTER_API_KEY)

settings = Settings()
