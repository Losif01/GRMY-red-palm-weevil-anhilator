import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Send an email via SMTP 
def send_email(to_email: str, subject: str, body: str) -> bool:
    try:
        message = MIMEMultipart()
        message["From"] = settings.FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        
        message.attach(MIMEText(body, "html"))
        
        # Connect to Gmail SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()  
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

# Generate and send an infestation alert email with tree details and detection results
def send_infestation_alert(
    user_email: str, 
    tree_name: str, 
    group_name: str,  
    confidence: float, 
    event_count: int
) -> bool:
    """
    Send infestation alert email to the user.
    """
    subject = f"🚨 Alert: Infestation Detected on {tree_name} in {group_name}"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
            <h2 style="color: #d32f2f;">🚨 Infestation Alert</h2>
            
            <p>Dear Palm Farm Owner,</p>
            
            <p>Our AI system has detected <strong>signs of infestation</strong> on one of your trees:</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Tree Name:</strong> {tree_name}</p>
                <p><strong>Group:</strong> {group_name}</p>  
                <p><strong>Confidence:</strong> {confidence*100:.1f}%</p>
                <p><strong>Events Detected:</strong> {event_count}</p>
            </div>
            
            <p><strong>Recommended Actions:</strong></p>
            <ul>
                <li>Inspect the tree as soon as possible</li>
                <li>Check for signs of red palm weevil</li>
                <li>Contact agricultural specialist if needed</li>
            </ul>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated message from Palm Monitoring System.
            </p>
        </div>
    </body>
    </html>
    """
    return send_email(to_email=user_email, subject=subject, body=body)