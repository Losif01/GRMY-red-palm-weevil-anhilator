import random
import time
from sqlalchemy.orm import Session
from app.crud import recording as recording_crud
from app.crud import notification as notification_crud
from app.crud import tree as tree_crud
from app.crud import user as user_crud
from app.crud import group as group_crud
from app.services.email_service import send_infestation_alert

# Threshold for triggering alert
INFESTATION_THRESHOLD = 0.6

# Simulate processing 
def process_recording(recording_uid: str) -> dict:
    """
    MOCK AI Processing Function
    
    TODO: Replace this with real model inference when ready.
    """
    
    print(f"\n[MOCK AI] Processing recording: {recording_uid}")
    time.sleep(2)
    
    # Generate results
    is_infested = True  
    
    if is_infested:
        prediction = "Infested"
        confidence = round(random.uniform(0.6, 0.95), 2)
        event_count = random.randint(3, 15)
        band_score = round(random.uniform(0.7, 0.95), 2)
    else:
        prediction = "Clean"
        confidence = round(random.uniform(0.7, 0.99), 2)
        event_count = random.randint(0, 2)
        band_score = round(random.uniform(0.1, 0.4), 2)
    
    results = {
        "prediction": prediction,
        "confidence": confidence,
        "event_count": event_count,
        "band_score": band_score,
    }
    
    print(f"[MOCK AI] Result: {prediction} ({confidence*100:.1f}% confidence)")
    print(f"   Events: {event_count}, Band Score: {band_score}")
    
    return results

# Save analysis results to the DB and trigger notifications 
def save_results_and_notify(db: Session, recording_uid: str, results: dict):
    recording = recording_crud.get_recording_by_id(db, recording_uid)
    if not recording:
        print(f"Recording not found: {recording_uid}")
        return
    
    # Update recording with AI results
    recording.prediction_from_model = results["prediction"]
    recording.confidence_percentage = results["confidence"]
    recording.event_count = results["event_count"]
    recording.band_score = results["band_score"]
    recording.processing_status = "Completed"
    
    db.commit()
    db.refresh(recording)
    
    print(f"Results saved to DB for recording: {recording_uid}")
    
    if results["prediction"] == "Infested" and results["confidence"] >= INFESTATION_THRESHOLD:
        _create_infestation_notification(db, recording)

# Create an infestation notification 
def _create_infestation_notification(db: Session, recording):
    tree = tree_crud.get_tree_by_id_only(db, recording.tree_id)
    if not tree:
        print(f"Tree not found: {recording.tree_id}")
        return
    
    # Get the group info
    group = group_crud.get_group_by_id_only(db, tree.group_id)
    group_name = group.group_name if group else "Unknown Group"
    
    owner = user_crud.get_user_by_id(db, tree.owner_id)
    if not owner:
        print(f"Owner not found: {tree.owner_id}")
        return
    
    message = (
        f"Warning: Infestation detected on tree '{tree.custom_name or tree.sensor_physical_id}' "
        f"in group '{group_name}'!\n"
        f"Confidence: {recording.confidence_percentage*100:.1f}%\n"
        f"Events detected: {recording.event_count}\n"
        f"Please inspect the tree as soon as possible."
    )
    
    # Create notification in DB
    notification_crud.create_notification(
        db=db,
        owner_uid=tree.owner_id,
        tree_uid=tree.tree_uid,
        message=message,
        notification_type="Email"
    )
    print(f"Notification created for tree owner: {tree.owner_id}")
    
    # Send email
    tree_name = tree.custom_name or tree.sensor_physical_id
    email_sent = send_infestation_alert(
        user_email=owner.email,
        tree_name=tree_name,
        group_name=group_name,  
        confidence=float(recording.confidence_percentage),
        event_count=recording.event_count or 0
    )
    
    if email_sent:
        recording.alert_sent = True
        db.commit()
        db.refresh(recording)
        print(f"Email sent successfully to {owner.email}")
        # print(f"alert_sent updated to True : {recording.recording_uid}")
    else:
        recording.alert_sent = False
        db.commit()
        print(f"Failed to send email to {owner.email}")