import os

import librosa
from sqlalchemy.orm import Session

from app.crud import group as group_crud
from app.crud import notification as notification_crud
from app.crud import recording as recording_crud
from app.crud import tree as tree_crud
from app.crud import user as user_crud
from app.services.email_service import send_infestation_alert
from app.services.model_service import model_instance

# Threshold for triggering alert
INFESTATION_THRESHOLD = 0.6


# Real Model
def process_recording(recording_uid: str, db: Session) -> dict:

    print(f"\nReal AI Processing recording: {recording_uid}")

    # Get recording from DB to fetch the actual file path
    recording = recording_crud.get_recording_by_id(db, recording_uid)
    if not recording:
        raise FileNotFoundError(f"Recording not found in DB: {recording_uid}")

    file_path = recording.raw_audio_file_path
    if not file_path or not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    print(f"Loading audio from {file_path}...")
    audio_data, sample_rate = librosa.load(file_path, sr=8000)
    print(f"Audio loaded: {len(audio_data)} samples at {sample_rate}Hz")

    # Call model
    print("Running inference...")
    result = model_instance.classify(audio_data, sample_rate)

    print(f"Model result: {result['label']} (confidence: {result['confidence']:.2%})")

    # Map model labels to database format (4 values)
    label_mapping = {
        "CLEAN": "Clean",
        "INFESTED": "Infested",
        "SUSPICIOUS": "Suspicious",
        "RETAKE": "Retake",
        "ERROR": "Retake",
    }

    prediction = label_mapping.get(result["label"], "Retake")

    print(f"Final prediction: {prediction}")

    return {
        "prediction": prediction,
        "confidence": result["confidence"],
        "event_count": result["event_count"],
        "band_score": result["band_score"],
        "raw_label": result["label"],
        "duration_sec": result.get("duration_sec", 0),
        "message": result.get("message"),
    }


# Save results and notification
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

    # Update the Tree's latest_reading_classification
    tree = tree_crud.get_tree_by_id_only(db, recording.tree_id)
    if tree:
        tree.latest_reading_classification = results["prediction"]
        tree.current_status = "ONLINE"
        print(
            f"Updated tree {tree.sensor_physical_id} with classification: {results['prediction']}"
        )
    else:
        print(f"Tree not found for recording: {recording_uid}")

    db.commit()
    db.refresh(recording)

    print(f"Results saved to DB for recording: {recording_uid}")

    # Terms for sending notification:
    if (
        results["prediction"] in ["Infested", "Suspicious"]
        and results["confidence"] >= INFESTATION_THRESHOLD
    ):
        print(f"Infestation detected! Triggering notification...")
        _create_infestation_notification(db, recording)
    else:
        print(f"No notification needed. Status: {results['prediction']}")


# Create notification if infested
def _create_infestation_notification(db: Session, recording):
    # Get tree info
    tree = tree_crud.get_tree_by_id_only(db, recording.tree_id)
    if not tree:
        print(f"Tree not found: {recording.tree_id}")
        return

    # Get group info
    group = (
        group_crud.get_group_by_id_only(db, tree.group_id) if tree.group_id else None
    )
    group_name = group.group_name if group else "Unknown Group"

    # Get owner info
    owner = user_crud.get_user_by_id(db, tree.owner_id)
    if not owner:
        print(f"Owner not found: {tree.owner_id}")
        return

    # Build notification message
    tree_name = tree.custom_name or tree.sensor_physical_id

    if recording.prediction_from_model == "Suspicious":
        warning_level = "Suspicious Activity Detected"
    else:
        warning_level = "Infestation Detected"

    message = (
        f"{warning_level} on tree '{tree_name}' "
        f"in group '{group_name}'!\n"
        f"Confidence: {recording.confidence_percentage * 100:.1f}%\n"
        f"Events detected: {recording.event_count}\n"
        f"Please inspect the tree as soon as possible."
    )

    # Create notification in DB
    notification = notification_crud.create_notification(
        db=db,
        owner_uid=tree.owner_id,
        tree_uid=tree.tree_uid,
        message=message,
        notification_type="Email",
    )
    print(f"Notification created for tree owner: {tree.owner_id}")

    # Send email
    email_sent = send_infestation_alert(
        user_email=owner.email,
        tree_name=tree_name,
        group_name=group_name,
        confidence=float(recording.confidence_percentage),
        event_count=recording.event_count or 0,
    )

    # Update notification and recording
    if email_sent:
        notification_crud.mark_notification_sent(db, notification)
        recording.alert_sent = True
        db.commit()
        db.refresh(recording)
        print(f"Email sent successfully to {owner.email}")
    else:
        recording.alert_sent = False
        db.commit()
        print(f"Failed to send email to {owner.email}")
