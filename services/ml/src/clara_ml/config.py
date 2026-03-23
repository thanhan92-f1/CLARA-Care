from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "clara-ml"
    environment: str = "development"
    default_embedder: str = "bge-m3"
    deepseek_api_key: str = Field(default="", validation_alias="DEEPSEEK_API_KEY")
    deepseek_base_url: str = Field(
        default="https://api.deepseek.com",
        validation_alias="DEEPSEEK_BASE_URL",
    )
    deepseek_model: str = Field(default="deepseek-v3.2", validation_alias="DEEPSEEK_MODEL")
    deepseek_timeout_seconds: float = Field(
        default=30.0,
        validation_alias=AliasChoices("DEEPSEEK_TIMEOUT_SECONDS", "DEEPSEEK_TIMEOUT"),
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
