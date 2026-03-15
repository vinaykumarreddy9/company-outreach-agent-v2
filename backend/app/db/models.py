from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Integer, Boolean, Enum as SQLEnum, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime
from datetime import UTC
import uuid
import enum

Base = declarative_base()

class CampaignStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESEARCHING_USER_COMPANY = "RESEARCHING_USER_COMPANY"
    FINDING_TARGET_COMPANIES = "FINDING_TARGET_COMPANIES"
    FINDING_DECISION_MAKERS = "FINDING_DECISION_MAKERS"
    DRAFTING_EMAILS = "DRAFTING_EMAILS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    INACTIVE = "INACTIVE"

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    user_query = Column(Text, nullable=False)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.PENDING)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(UTC))
    
    # Target company parameters
    target_industry = Column(String, nullable=True)
    target_location = Column(String, nullable=True)
    target_employee_count = Column(String, nullable=True)
    
    # Relationships
    user_intel = relationship("UserCompanyIntel", back_populates="campaign", uselist=False, cascade="all, delete-orphan")
    target_companies = relationship("TargetCompany", back_populates="campaign", cascade="all, delete-orphan")
    dms = relationship("DecisionMaker", back_populates="campaign", cascade="all, delete-orphan")
    drafts = relationship("EmailDraft", back_populates="campaign", cascade="all, delete-orphan")
    logs = relationship("CommunicationLog", back_populates="campaign", cascade="all, delete-orphan")

class UserCompanyIntel(Base):
    __tablename__ = "user_company_intel"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"))
    company_name = Column(String, nullable=False)
    website = Column(String)
    motto = Column(Text)
    offerings = Column(Text)
    deep_research = Column(Text)
    
    campaign = relationship("Campaign", back_populates="user_intel")

class TargetCompany(Base):
    __tablename__ = "target_companies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"))
    name = Column(String, nullable=False)
    website = Column(String)
    linkedin = Column(String)
    location = Column(String)
    contact_email = Column(String)
    contact_number = Column(String)
    deep_research = Column(Text)
    similarity_score = Column(JSON) # Store score and reasoning
    rejection_reason = Column(Text, nullable=True)
    status = Column(String, default="ACTIVE") # NEW, ACTIVE, DISCOVERY_CALL, TERMINATED, REJECTED
    
    campaign = relationship("Campaign", back_populates="target_companies")
    dms = relationship("DecisionMaker", back_populates="target_company", cascade="all, delete-orphan")

class DecisionMaker(Base):
    __tablename__ = "decision_makers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"))
    target_company_id = Column(String, ForeignKey("target_companies.id"))
    name = Column(String, nullable=False)
    position = Column(String)
    email = Column(String)
    linkedin = Column(String)
    similarity_score = Column(JSON) # Store score and reasoning
    hubspot_id = Column(String, nullable=True)
    status = Column(String, default="NEW") # NEW, SYNCED, DRAFTED, INITIAL_SENT, FOLLOWUP_X_SENT, DISCOVERY_CALL, TERMINATED
    followup_count = Column(Integer, default=0)
    last_message_id = Column(String, nullable=True) # ID of the last email sent
    thread_id = Column(String, nullable=True) # References/In-Reply-To header
    
    # Scheduling Fields (Discovery Subsystem)
    meeting_link = Column(String, nullable=True)
    scheduled_time = Column(DateTime, nullable=True)
    timezone = Column(String, nullable=True)
    scheduling_note = Column(Text, nullable=True) # Reason for slot shift or conflict resolution
    reminder_24h_sent = Column(Boolean, default=False)
    reminder_1h_sent = Column(Boolean, default=False)
    
    campaign = relationship("Campaign", back_populates="dms")
    target_company = relationship("TargetCompany", back_populates="dms")
    drafts = relationship("EmailDraft", back_populates="dm", cascade="all, delete-orphan")
    logs = relationship("CommunicationLog", back_populates="dm", cascade="all, delete-orphan")

class EmailDraft(Base):
    __tablename__ = "email_drafts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"))
    decision_maker_id = Column(String, ForeignKey("decision_makers.id"))
    subject = Column(String)
    body = Column(Text)
    status = Column(String, default="DRAFTED") # DRAFTED, APPROVED, SENT
    is_approved = Column(Boolean, default=False)
    message_id = Column(String, nullable=True) # To track once sent
    sent_at = Column(DateTime, nullable=True)
    followup_index = Column(Integer, default=0) # 0 for initial, 1-11 for follow-ups
    
    campaign = relationship("Campaign", back_populates="drafts")
    dm = relationship("DecisionMaker", back_populates="drafts")

class CommunicationLog(Base):
    __tablename__ = "communication_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"))
    dm_id = Column(String, ForeignKey("decision_makers.id"))
    direction = Column(String) # SENT, RECEIVED
    subject = Column(String)
    body = Column(Text)
    message_id = Column(String) # For threading match
    received_at = Column(DateTime, default=lambda: datetime.datetime.now(UTC))
    
    dm = relationship("DecisionMaker", back_populates="logs")
    campaign = relationship("Campaign", back_populates="logs")
