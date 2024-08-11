from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    #configuration files
    adapter_conf_file: Path = Path("app/config/adapters_config.json")
    modulator_conf_dir: str = "app/config/"
    
    # Logger settings
    log_directory: str = "logs/"
    log_file_size: int = 5 * 1024 * 1024  # 5 MB
    log_backup_count: int = 3  # Number of backup log files to keep
    log_ffmpeg_file: str = "ffmpeg_adapter_"
    
    
    class Config:
        env_file = ".env"

settings = Settings()

