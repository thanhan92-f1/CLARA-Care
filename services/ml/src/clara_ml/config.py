from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "clara-ml"
    environment: str = "development"
    default_embedder: str = "bge-m3"
    embedding_api_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "EMBEDDING_API_KEY",
            "RAG_EMBEDDING_API_KEY",
            "YESCALE_API_KEY",
        ),
    )
    embedding_base_url: str = Field(
        default="https://api.yescale.io/v1",
        validation_alias=AliasChoices("EMBEDDING_BASE_URL", "RAG_EMBEDDING_BASE_URL"),
    )
    embedding_model: str = Field(
        default="text-embedding-3-large",
        validation_alias=AliasChoices("EMBEDDING_MODEL", "RAG_EMBEDDING_MODEL"),
    )
    embedding_timeout_seconds: float = Field(
        default=6.0,
        validation_alias=AliasChoices(
            "EMBEDDING_TIMEOUT_SECONDS",
            "RAG_EMBEDDING_TIMEOUT_SECONDS",
        ),
    )
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
    external_ddi_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("EXTERNAL_DDI_ENABLED", "CAREGUARD_EXTERNAL_DDI_ENABLED"),
    )
    external_ddi_timeout_seconds: float = Field(
        default=1.5,
        validation_alias=AliasChoices(
            "EXTERNAL_DDI_TIMEOUT_SECONDS", "CAREGUARD_EXTERNAL_DDI_TIMEOUT_SECONDS"
        ),
    )
    pubmed_connector_timeout_seconds: float = Field(
        default=4.0,
        validation_alias=AliasChoices(
            "PUBMED_CONNECTOR_TIMEOUT_SECONDS", "RAG_EXTERNAL_TIMEOUT_SECONDS"
        ),
    )
    pubmed_esearch_max_results: int = Field(
        default=3,
        validation_alias="PUBMED_ESEARCH_MAX_RESULTS",
        ge=1,
        le=10,
    )
    europe_pmc_max_results: int = Field(
        default=3,
        validation_alias="EUROPE_PMC_MAX_RESULTS",
        ge=1,
        le=10,
    )
    rag_external_connectors_enabled: bool = Field(
        default=True,
        validation_alias="RAG_EXTERNAL_CONNECTORS_ENABLED",
    )
    searxng_base_url: str = Field(
        default="",
        validation_alias="SEARXNG_BASE_URL",
    )
    searxng_timeout_seconds: float = Field(
        default=3.0,
        validation_alias="SEARXNG_TIMEOUT_SECONDS",
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
