from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    rabbitmq_url: str = "amqp://urban:urban@urban-rabbitmq:5672/"
    openai_api_key: str
    model_version: str = "gpt-4o-2024-05-13"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        protected_namespaces=(),  # allows field names starting with "model_"
    )


# Single instance used throughout the app
settings = Settings()
