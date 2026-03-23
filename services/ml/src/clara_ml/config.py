from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "clara-ml"
    environment: str = "development"
    default_embedder: str = "bge-m3"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="CLARA_ML_", extra="ignore")


settings = Settings()
