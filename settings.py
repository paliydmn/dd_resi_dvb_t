from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Server settings
    default_port: int = 8008

    #configuration files
    adapter_conf_file: Path = Path("app/config/adapters_config.json")
    modulator_conf_dir: str = "app/config/"
    
    # Logger settings
    log_directory: str = "logs/" # Adjust this path as needed
    log_file_size: int = 1 * 1024 * 1024  # 1 MB
    log_backup_count: int = 3  # Number of backup log files to keep
    log_main_file: str = "resicast.log"
    log_ffmpeg_file: str = "ff_" #the <adapter_name> and <adapter id> will be added to ff log files


    # Modulator settings
    mod_devid: str = "0222dd01"
    mod_card_path: str = "/sys/class/ddbridge/" 

    #tools
    modconfig_app: str = "./tools/modconfig"
    
    
    class Config:
        env_file = ".env"

settings = Settings()

