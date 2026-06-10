from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class GeoPoint(BaseModel):
    lat: float
    lon: float


# The event payload published by the Reports Server when a new report is created
class ReportCreatedPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    report_id: str = Field(alias="reportId")
    reporter_user_id: str = Field(alias="reporterUserId")
    title: str
    description: str
    category: str  # user-selected, we verify/confirm it
    location: GeoPoint
    created_at: str = Field(alias="createdAt")
    attachments: Optional[List[str]] = None  # HTTP URLs; not in spec but used for vision if present


# Internal result from GPT-4o before publishing
class ClassificationResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())  # allows "model_version" field

    classified_category: str
    confidence: float  # 0.0 – 1.0
    model_version: str


# The event payload we publish back to RabbitMQ (matches AsyncAPI contract)
class ReportClassifiedPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    report_id: str = Field(serialization_alias="reportId")
    model_version: str = Field(serialization_alias="modelVersion")
    classified_category: str = Field(serialization_alias="classifiedCategory")
    confidence: float
    classified_at: str = Field(serialization_alias="classifiedAt")
