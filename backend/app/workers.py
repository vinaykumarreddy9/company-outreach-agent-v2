from app.db.database import SessionLocal
from app.db import models
from app.agents.user_intel import research_user_company
from app.agents.company_finder import find_target_companies
from app.agents.dm_finder import find_decision_makers
from app.agents.email_drafter import draft_personalized_email, draft_followup_email, draft_nudge_email
from app.agents.intent_classifier import classify_reply_intent
from app.agents.discovery_agent import extract_schedule_info, draft_discovery_request
from app.integrations.hubspot import hubspot_provider
from app.integrations.imap import imap_provider
from app.integrations.calendly import calendly_provider
import json
import re
import datetime
import pytz
from datetime import UTC
import gc



def research_user_company_worker(campaign_id: str):
    db = SessionLocal()
    try:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        if not campaign: return
        
        intel = campaign.user_intel
        if not intel: return
        
        research_data = research_user_company(intel.website)
        if research_data:
            intel.company_name = research_data.get("exact_company_name")
            intel.website = research_data.get("website")
            intel.motto = research_data.get("moto")
            intel.offerings = json.dumps(research_data.get("core_offerings"))
            intel.deep_research = research_data.get("deep_research")
            db.commit()
            check_phase_1_completion(campaign_id)
    except Exception as e:
        print(f"User Research Error: {e}")
    finally:
        db.close()

def check_phase_1_completion(campaign_id: str):
    """Synchronization Gate: Triggers Phase 2 only when both parallel tasks are done."""
    db = SessionLocal()
    try:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        intel = campaign.user_intel
        
        # Criteria: Research deep analysis completed (Analysis component removed)
        if intel and intel.deep_research and intel.deep_research not in ["Analysis pending deep synchronization.", "Identity verified through site architecture."]:
            print(f"[MISSION CONTROL] User Intel Phase Complete for {campaign_id}. Triggering Company Finder.")
            campaign.status = models.CampaignStatus.FINDING_TARGET_COMPANIES
            db.commit()
            find_companies_worker(campaign_id)
    finally:
        db.close()

def find_companies_worker(campaign_id: str):
    db = SessionLocal()
    try:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        if not campaign: return
        
        user_intel = campaign.user_intel
        if not user_intel: return
        
        # Use direct inputs from DB
        criteria = {
            "industry": campaign.target_industry,
            "location": campaign.target_location,
            "employee_count": campaign.target_employee_count
        }
        
        # 1. Find Companies
        # user_intel.offerings might be a string (from agent) or JSON
        offerings_list = []
        try:
            offerings_list = json.loads(user_intel.offerings)
        except:
            offerings_list = [user_intel.offerings]

        # 1. Find Companies (Incremental Store)
        for co in find_target_companies(criteria, offerings_list):
            score = co.get("similarity_score", 0)
            status = co.get("status", "REJECTED")
            is_valid = (status == "NEW")
            
            new_co = models.TargetCompany(
                campaign_id=campaign_id,
                name=co.get("name"),
                website=co.get("website"),
                domain=co.get("domain"),
                linkedin=co.get("linkedin"),
                location=co.get("location"),
                contact_email="N/A",
                contact_number="N/A",
                deep_research=co.get("deep_research"),
                similarity_score={"score": score, "reason": co.get("score_reason", "")},
                rejection_reason=co.get("rejection_reason"),
                status=status
            )
            db.add(new_co)
            db.commit() # Flush immediately for UI polling
            print(f"Incremental Discovery: Saved {co.get('name')} ({status} | Score: {score})")

        # 2. Trigger next isolated agent
        campaign.status = models.CampaignStatus.FINDING_DECISION_MAKERS
        db.commit()
        find_dms_worker(campaign_id)
    except Exception as e:
        print(f"Error in Company Finder Work: {e}")
        db.rollback()
def predict_prospect_email(name: str, domain: str) -> str:
    """
    Generates a high-probability corporate email address based on name and domain.
    Standard: firstname.lastname@domain
    """
    if not name or not domain or domain == "unknown":
        return None
    
    clean_name = re.sub(r'[^a-zA-Z\s]', '', name).lower().strip()
    parts = clean_name.split()
    if len(parts) >= 2:
        return f"{parts[0]}.{parts[-1]}@{domain}"
    return f"{parts[0]}@{domain}"

def find_dms_worker(campaign_id: str):
    print(f"[MISSION CONTROL] Phase: DM Discovery for {campaign_id}")
    db = SessionLocal()
    try:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        if not campaign:
            print(f"[MISSION CONTROL] Aborting DM Finder: Campaign {campaign_id} not found.")
            return
        
        # We process 'NEW' companies (those just found by the previous agent)
        target_cos = db.query(models.TargetCompany).filter(
            models.TargetCompany.campaign_id == campaign_id,
            models.TargetCompany.status == "NEW"
        ).all()
        
        if not target_cos:
            print(f"[MISSION CONTROL] No NEW companies to process for {campaign_id}. Skipping to drafting.")
            campaign.status = models.CampaignStatus.DRAFTING_EMAILS
            db.commit()
            draft_emails_worker(campaign_id)
            return

        # Sequential processing to stay within memory limits (Render Free Tier)
        print(f"[MISSION CONTROL] Processing {len(target_cos)} companies sequentially for memory stability.")
        
        for co in target_cos:
            try:
                print(f"[DM FINDER] Researching stakeholders for: {co.name} in {co.location}")
                dms = find_decision_makers(co.name, co.location)
                
                # Atomically save DMs for this company
                with SessionLocal() as local_db:
                    saved_count = 0
                    for dm in dms:
                        score = dm.get("similarity_score", 0)
                        if score >= 70:
                            new_dm = models.DecisionMaker(
                                campaign_id=campaign_id,
                                target_company_id=co.id,
                                name=dm.get("name"),
                                position=dm.get("position"),
                                linkedin=dm.get("linkedin"),
                                similarity_score={"score": score, "reason": dm.get("score_reason", "")},
                                status="NEW"
                            )
                            local_db.add(new_dm)
                            local_db.flush()
                            
                            # Generate and store predicted email
                            email = predict_prospect_email(dm.get("name"), co.domain)
                            new_dm.email = email
                            
                            try:
                                hs_id = hubspot_provider.create_lead(dm, co.name, email=email)
                                if hs_id:
                                    new_dm.hubspot_id = hs_id
                                    new_dm.status = "SYNCED"
                            except Exception as hs_e:
                                print(f"HubSpot Integration Error for {dm.get('name')}: {hs_e}")
                            
                            saved_count += 1
                    
                    local_db.commit()
                    print(f"[DM FINDER] Saved {saved_count} stakeholders for {co.name}.")
                
                # Update company status so we don't re-process it
                co.status = "ACTIVE"
                db.commit()

            except Exception as proc_e:
                print(f"Error processing DMs for {co.name}: {proc_e}")
            
            # Memory harvest
            gc.collect()

        # Update Mission Status
        print(f"[MISSION CONTROL] DM Finding phase complete for {campaign_id}. Transitioning to Ghostwriter...")
        campaign.status = models.CampaignStatus.DRAFTING_EMAILS
        db.commit()
        
        # Explicitly call next stage
        draft_emails_worker(campaign_id)
        
    except Exception as e:
        print(f"Operational Error in DM Finder: {e}")
        db.rollback()
    finally:
        db.close()

def draft_emails_worker(campaign_id: str):
    db = SessionLocal()
    try:
        print(f"[MISSION CONTROL] Initiating Email Ghostwriting for campaign {campaign_id}...")
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        if not campaign or not campaign.user_intel: 
            print(f"Aborting Email Drafting: Missing campaign or intel for {campaign_id}")
            return
        
        user_intel_raw = campaign.user_intel
        offerings = []
        try:
            offerings = json.loads(user_intel_raw.offerings)
            if not isinstance(offerings, list):
                offerings = [str(offerings)]
        except:
            offerings = [str(user_intel_raw.offerings)]
            
        user_intel = {
            "company_name": user_intel_raw.company_name,
            "moto": user_intel_raw.motto or "N/A",
            "offerings": offerings,
            "deep_research": user_intel_raw.deep_research
        }
        
        dms = db.query(models.DecisionMaker).filter(models.DecisionMaker.campaign_id == campaign_id).all()
        print(f"Drafting for {len(dms)} validated stakeholders.")
        
        for dm in dms:
            # 1. Skip if already drafted
            if db.query(models.EmailDraft).filter(models.EmailDraft.decision_maker_id == dm.id).first():
                continue

            # 2. Get target company research
            target_co = db.query(models.TargetCompany).filter(models.TargetCompany.id == dm.target_company_id).first()
            if not target_co: continue
            
            # 3. Draft with individual try/except
            try:
                print(f"[GHOSTWRITER] Creating personalized draft for {dm.name} at {target_co.name}...")
                draft_data = draft_personalized_email(user_intel, {"name": dm.name, "position": dm.position}, target_co.name, target_co.deep_research)
                if draft_data:
                    new_draft = models.EmailDraft(
                        campaign_id=campaign_id,
                        decision_maker_id=dm.id,
                        subject=draft_data.get("subject"),
                        body=draft_data.get("body"),
                        status="DRAFTED"
                    )
                    db.add(new_draft)
                    dm.status = "DRAFTED"
                    db.commit() # Commit each draft for UI progress & durability
                    print(f"[GHOSTWRITER] Success: Draft saved for {dm.name}")
                else:
                    print(f"[GHOSTWRITER] Warning: Agent returned empty draft for {dm.name}")
            except Exception as draft_e:
                print(f"Failure drafting email for {dm.name}: {draft_e}")
                db.rollback()
            
            # 4. Memory management
            gc.collect()
                
        campaign.status = models.CampaignStatus.COMPLETED
        db.commit()
        print(f"[MISSION CONTROL] Campaign {campaign_id} fully deployed and completed.")
    except Exception as e:
        print(f"Error in Email Drafter Work: {e}")
        db.rollback()
    finally:
        db.close()

def poll_inbox_task():
    """Background Sentinel: Polls for replies and classifies intent."""
    print("[SENTINEL] Scanning inbox for prospect interactions...")
    db = SessionLocal()
    try:
        replies = imap_provider.get_latest_replies()
        for reply in replies:
            # 1. Matching Logic (Threading first, Email fallback)
            dm = None
            in_reply_to = (reply.get("in_reply_to") or "").strip()
            
            if in_reply_to:
                # Try exact match first
                dm = db.query(models.DecisionMaker).filter(models.DecisionMaker.last_message_id == in_reply_to).first()
                if not dm:
                    # Try cleaning brackets if stored differently
                    clean_id = in_reply_to.strip("<>")
                    dm = db.query(models.DecisionMaker).filter(models.DecisionMaker.last_message_id.contains(clean_id)).first()
            
            if not dm:
                # Fallback: Extract email from "Name <email@domain.com>"
                email_match = re.search(r'[\w\.-]+@[\w\.-]+', reply.get("from", ""))
                if email_match:
                    clean_email = email_match.group(0).lower()
                    dm = db.query(models.DecisionMaker).filter(models.DecisionMaker.email == clean_email).first()
                    if dm:
                        print(f"[SENTINEL] Match Found via Email Fallback: {dm.name}")

            if dm:
                # 2. Duplicate Detection (Direction-Aware)
                existing_log = db.query(models.CommunicationLog).filter(
                    models.CommunicationLog.message_id == reply.get("message_id"),
                    models.CommunicationLog.direction == "RECEIVED"
                ).first()
                if existing_log: 
                    continue

                print(f"[SENTINEL] Match Found: {dm.name} from {dm.target_company.name}")
                
                # 2. Extract History for Agent
                last_sent = db.query(models.CommunicationLog).filter(
                    models.CommunicationLog.dm_id == dm.id,
                    models.CommunicationLog.direction == "SENT"
                ).order_by(models.CommunicationLog.received_at.desc()).first()
                
                original_text = last_sent.body if last_sent else "Initial context missing."
                
                # 3. AI Intent Audit
                classification = classify_reply_intent(original_text, reply["body"])
                intent = classification["intent"]
                reason = classification["reasoning"]
                dm.reply_intent = intent
                print(f"[SENTINEL] Intent for {dm.name}: {intent} ({reason})")

                # 4. Log Communication
                new_log = models.CommunicationLog(
                    campaign_id=dm.campaign_id,
                    dm_id=dm.id,
                    direction="RECEIVED",
                    subject=reply["subject"],
                    body=reply["body"],
                    message_id=reply["message_id"]
                )
                db.add(new_log)
                db.flush()

                # 5. Execute State Transition
                process_intent_transition(db, dm, intent)
                
        db.commit()
    except Exception as e:
        print(f"[SENTINEL] Operational Error: {e}")
        db.rollback()
    finally:
        db.close()

def process_intent_transition(db, dm, intent):
    """Executes the business logic of Phase 2 transitions."""
    if intent == "POSITIVE":
        # Strategy: We REQUIRE two phases for discovery. 
        # Phase 1: Prospect expresses interest -> Request availability.
        # Phase 2: Prospect replies to availability request with a timeslot -> Book.
        
        if dm.status != "WAITING_FOR_REPLY":
            # Phase 1: Start Discovery Phase (Invitation)
            # Immediate Termination of others at same company to avoid duplicate threads
            target_co = dm.target_company
            if target_co: target_co.status = "DISCOVERY_CALL"
            others = db.query(models.DecisionMaker).filter(
                models.DecisionMaker.target_company_id == target_co.id,
                models.DecisionMaker.id != dm.id
            ).all()
            for other in others:
                other.status = "TERMINATED"
                hubspot_provider.update_lead_status(other.hubspot_id, "Terminated (Internal Lead Found)")
            
            # Trigger Discovery Drafting (The Availability Request)
            draft_discovery_worker(dm.id, db=db)
        else:
            # Phase 2: Prospect has replied to our specific availability request
            last_reply = db.query(models.CommunicationLog).filter(
                models.CommunicationLog.dm_id == dm.id,
                models.CommunicationLog.direction == "RECEIVED"
            ).order_by(models.CommunicationLog.received_at.desc()).first()
            
            if last_reply: 
                process_discovery_reply(db, dm, last_reply.body)
            
    elif intent == "NEGATIVE":
        # LOSS: Terminate DM
        dm.status = "TERMINATED"
        hubspot_provider.update_lead_status(dm.hubspot_id, "Terminated")
        
    elif intent == "NEUTRAL":
        # RETENTION: Automated Follow-up Trigger
        if dm.followup_count < 11:
            # We don't increment count here, we increment when SENDING
            draft_followup_worker(dm.id)
        else:
            dm.status = "TERMINATED"
            hubspot_provider.update_lead_status(dm.hubspot_id, "Terminated (Exhausted 11 Follow-ups)")

def draft_followup_worker(dm_id: str):
    """Drafts a persistent follow-up when intent is Neutral."""
    db = SessionLocal()
    try:
        dm = db.query(models.DecisionMaker).filter(models.DecisionMaker.id == dm_id).first()
        if not dm: return
        
        campaign = dm.campaign
        user_intel = {
            "company_name": campaign.user_intel.company_name,
            "deep_research": campaign.user_intel.deep_research
        }
        
        # Build thread history for LLM
        logs = db.query(models.CommunicationLog).filter(
            models.CommunicationLog.dm_id == dm.id
        ).order_by(models.CommunicationLog.received_at.desc()).limit(5).all()
        
        history_text = "\n".join([f"{log.direction}: {log.body}" for log in logs])
        
        dm.followup_count += 1
        
        draft_data = draft_followup_email(
            user_intel=user_intel,
            dm_info={"name": dm.name},
            target_company_name=dm.target_company.name,
            thread_history=history_text,
            followup_number=dm.followup_count
        )
        
        if draft_data:
            new_draft = models.EmailDraft(
                campaign_id=campaign.id,
                decision_maker_id=dm.id,
                subject=draft_data["subject"],
                body=draft_data["body"],
                status="DRAFTED"
            )
            db.add(new_draft)
            dm.status = f"FOLLOWUP_{dm.followup_count}_DRAFTED"
            db.commit()
            print(f"[FOLLOW-UP] persistence triggered for {dm.name} (#{dm.followup_count})")
    finally:
        db.close()

def draft_discovery_worker(dm_id: str, db=None):
    """Drafts the initial discovery call request."""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
    try:
        dm = db.query(models.DecisionMaker).filter(models.DecisionMaker.id == dm_id).first()
        if not dm: return
        
        campaign = dm.campaign
        user_intel_obj = campaign.user_intel
        offerings = []
        try:
            offerings = json.loads(user_intel_obj.offerings)
            if not isinstance(offerings, list):
                offerings = [str(offerings)]
        except:
            offerings = [str(user_intel_obj.offerings)]
            
        user_intel = {
            "name": user_intel_obj.company_name,
            "offerings": ", ".join(offerings) if offerings else "AI-driven professional solutions",
            "deep_research": user_intel_obj.deep_research
        }
        
        # Get last reply to use as context
        last_reply = db.query(models.CommunicationLog).filter(
            models.CommunicationLog.dm_id == dm.id,
            models.CommunicationLog.direction == "RECEIVED"
        ).order_by(models.CommunicationLog.received_at.desc()).first()
        
        draft = draft_discovery_request(
            user_intel=user_intel,
            dm_name=dm.name,
            dm_position=dm.position,
            target_company=dm.target_company.name,
            last_interest=last_reply.body if last_reply else "Interest in AI solutions"
        )
        
        if draft:
            new_draft = models.EmailDraft(
                campaign_id=campaign.id,
                decision_maker_id=dm.id,
                subject=draft["subject"],
                body=draft["body"],
                status="DRAFTED"
            )
            db.add(new_draft)
            dm.status = "DISCOVERY_CALL"
            if should_close:
                db.commit()
            print(f"[DISCOVERY] Draft created for {dm.name} and status updated to DISCOVERY_CALL")
    except Exception as e:
        if should_close: db.rollback()
        raise e
    finally:
        if should_close:
            db.close()

def process_discovery_reply(db, dm, reply_text: str):
    """Autonomous Scheduling Agent Logic with IST Normalization."""
    print(f"[SCHEDULER] Processing Discovery Reply from {dm.name}...")
    
    # 1. Extract Details
    today = datetime.date.today().isoformat()
    location_context = dm.target_company.location if dm.target_company else "Unknown"
    info = extract_schedule_info(reply_text, today, location_context)
    if not info or not info.get("date") or not info.get("time"):
        print("[SCHEDULER] Could not parse date/time reliably.")
        return

    # 2. Timezone Normalization to IST
    # Mapping common abbreviations to pytz identifiers
    TZ_MAP = {
        "IST": "Asia/Kolkata",
        "PST": "America/Los_Angeles",
        "PDT": "America/Los_Angeles",
        "EST": "America/New_York",
        "EDT": "America/New_York",
        "CST": "America/Chicago",
        "CDT": "America/Chicago",
        "MST": "America/Denver",
        "MDT": "America/Denver",
        "GMT": "UTC",
        "UTC": "UTC",
        "BST": "Europe/London",
        "CET": "Europe/Paris",
        "CEST": "Europe/Paris",
    }
    
    raw_tz = (info.get("timezone") or "UTC").upper()
    pytz_zone_name = TZ_MAP.get(raw_tz, "UTC")
    
    try:
        source_tz = pytz.timezone(pytz_zone_name)
        ist_tz = pytz.timezone("Asia/Kolkata")
        
        # Construct localized source time
        naive_dt = datetime.datetime.strptime(f"{info['date']} {info['time']}", "%Y-%m-%d %H:%M")
        localized_dt = source_tz.localize(naive_dt)
        
        # Convert to IST
        ist_dt = localized_dt.astimezone(ist_tz)
        print(f"[SCHEDULER] Normalized {info['date']} {info['time']} {raw_tz} -> {ist_dt.strftime('%Y-%m-%d %H:%M')} IST")
    except Exception as e:
        print(f"[SCHEDULER] Timezone conversion error: {e}")
        return

    # 3. Conflict Resolution & Automated Booking (Using IST for internal checks)
    is_available = calendly_provider.check_availability(ist_dt, ist_dt + datetime.timedelta(minutes=30))
    
    final_ist_dt = ist_dt
    note = f"Direct booking from {raw_tz} request. Normalized to IST."
    
    if not is_available:
        final_ist_dt = calendly_provider.get_next_available_slot(ist_dt)
        note = f"Conflict detected at requested time ({ist_dt.strftime('%H:%M')} IST). Secured next available IST slot."
        print(f"[SCHEDULER] Conflict! Recoordinating to {final_ist_dt} IST")

    # 4. Finalize Booking
    booking = calendly_provider.book_meeting(dm.email, dm.name, final_ist_dt)
    
    # 5. Commit to Intelligence Vault
    dm.status = "DATE_AND_MEETING_SECURED"
    if dm.target_company:
        dm.target_company.status = "DATE_AND_MEETING_SECURED"
    dm.meeting_link = booking["link"]
    
    # Store exact IST wall clock without UTC translation logic
    literal_ist_clock_time = final_ist_dt.replace(tzinfo=None)
    dm.scheduled_time = literal_ist_clock_time
    dm.timezone = "IST" # Always store as IST now
    dm.scheduling_note = note
    
    hubspot_provider.update_lead_status(dm.hubspot_id, f"Meeting Booked (IST): {final_ist_dt.strftime('%Y-%m-%d %H:%M')}")
    print(f"[SCHEDULER] SUCCESS: Meeting secured for {dm.name} | {final_ist_dt} IST")

def check_upcoming_meetings_task():
    """Sentinel for meeting reminders."""
    db = SessionLocal()
    try:
        now = datetime.datetime.now(UTC)
        # Find all secured DMs
        booked_dms = db.query(models.DecisionMaker).filter(models.DecisionMaker.status == "DATE_AND_MEETING_SECURED").all()
        
        for dm in booked_dms:
            if not dm.scheduled_time: continue
            
            # Ensure scheduled_time is timezone-aware for comparison
            meeting_time = dm.scheduled_time.replace(tzinfo=UTC)
            time_until = meeting_time - now
            
            # 1. 24-Hour Reminder
            if datetime.timedelta(hours=22) < time_until < datetime.timedelta(hours=25):
                if not dm.reminder_24h_sent:
                    send_reminder(dm, "24h")
                    dm.reminder_24h_sent = True
                    db.commit()
            
            # 2. 1-Hour Reminder
            if datetime.timedelta(minutes=45) < time_until < datetime.timedelta(minutes=75):
                if not dm.reminder_1h_sent:
                    send_reminder(dm, "1h")
                    dm.reminder_1h_sent = True
                    db.commit()
    finally:
        db.close()

def send_reminder(dm, type):
    """Dispatches the reminder email."""
    from app.core.email_service import email_service
    
    subject = f"Reminder: Discovery Call with {dm.campaign.user_intel.company_name} ({type} to go)"
    body = f"Hi {dm.name},\n\nThis is a quick reminder for our discovery call scheduled in {type}.\n\n"
    if dm.scheduling_note and "Conflict" in dm.scheduling_note:
        body += f"Note: {dm.scheduling_note}\n\n"
    
    body += f"Meeting Link: {dm.meeting_link}\n\nLooking forward to it!"
    
    email_service.send_email(dm.email, subject, body, thread_id=dm.thread_id)
    hubspot_provider.update_lead_status(dm.hubspot_id, f"{type} Reminder Sent")
    print(f"[SENTINEL] {type} Reminder sent to {dm.name}")
def check_inactivity_reminders_task():
    """Silence Sentinel: Checks for non-responsive prospects and triggers nudges."""
    print("[SENTINEL] Auditing prospect silence levels...")
    db = SessionLocal()
    try:
        from datetime import timedelta
        now = datetime.datetime.now(UTC)
        threshold = timedelta(days=2)
        
        # Targets: Prospects who are in a 'Sent' state but haven't replied
        active_states = ["INITIAL_SENT", "REMINDER_1_SENT", "REMINDER_2_SENT"]
        # Also target FOLLOWUP_X_SENT
        prospects = db.query(models.DecisionMaker).filter(
            (models.DecisionMaker.status.in_(active_states)) |
            (models.DecisionMaker.status.contains("FOLLOWUP_"))
        ).all()
        
        for dm in prospects:
            # 1. Safety Check: Did we receive anything since our last sent message?
            last_received = db.query(models.CommunicationLog).filter(
                models.CommunicationLog.dm_id == dm.id,
                models.CommunicationLog.direction == "RECEIVED"
            ).order_by(models.CommunicationLog.received_at.desc()).first()
            
            last_sent = db.query(models.CommunicationLog).filter(
                models.CommunicationLog.dm_id == dm.id,
                models.CommunicationLog.direction == "SENT"
            ).order_by(models.CommunicationLog.received_at.desc()).first()
            
            if not last_sent: continue
            
            # If they replied after our last message, they aren't "silent"
            if last_received and last_received.received_at > last_sent.received_at:
                continue
                
            time_since_last_sent = now - last_sent.received_at.replace(tzinfo=UTC)
            
            if time_since_last_sent > threshold:
                process_inactivity_transition(db, dm, last_sent)
                
        db.commit()
    except Exception as e:
        print(f"[SENTINEL] Inactivity Audit Error: {e}")
        db.rollback()
    finally:
        db.close()

def process_inactivity_transition(db, dm, last_sent_log):
    """Executes the automated reminder sequence."""
    from app.core.email_service import email_service
    
    current_status = dm.status
    target_status = None
    hs_label = None
    
    # Logic Branching based on current silence level
    if current_status == "INITIAL_SENT" or current_status.startswith("FOLLOWUP_"):
        target_status = "REMINDER_1_SENT"
        hs_label = "Reminder 1 Sent"
    elif current_status == "REMINDER_1_SENT":
        target_status = "REMINDER_2_SENT"
        hs_label = "Reminder 2 Sent"
    elif current_status == "REMINDER_2_SENT":
        # Final stage: Silence leading to termination
        dm.status = "TERMINATED"
        hubspot_provider.update_lead_status(dm.hubspot_id, "Terminated (No Reply)")
        print(f"[SENTINEL] Terminating silent prospect: {dm.name}")
        return

    if target_status:
        try:
            # 1. Draft a lightweight nudge
            body = draft_nudge_email(dm.name, dm.campaign.user_intel.company_name)
            subject = f"Re: {last_sent_log.subject}"
            
            # 2. Deploy Threaded Nudge
            msg_id = email_service.send_email(
                to_email=dm.email,
                subject=subject,
                body=body,
                thread_id=dm.thread_id
            )
            
            # 3. Log Communication
            new_log = models.CommunicationLog(
                campaign_id=dm.campaign_id,
                dm_id=dm.id,
                direction="SENT",
                subject=subject,
                body=body,
                message_id=msg_id
            )
            db.add(new_log)
            
            # 4. Update State
            dm.status = target_status
            dm.last_message_id = msg_id
            hubspot_provider.update_lead_status(dm.hubspot_id, hs_label)
            
            print(f"[SENTINEL] Silence broken: {hs_label} deployed to {dm.name}")
            
        except Exception as e:
            print(f"[SENTINEL] Failed to deploy nudge to {dm.name}: {e}")
