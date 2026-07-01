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
    event_count: int,
    notification_uid: str = None
) -> bool:
    """
    Send infestation alert email to the user.
    """
    subject = f"🚨 Alert: Infestation Detected on {tree_name} in {group_name}"
    
    # Build notification URL
    notification_url = "http://localhost:5173/notifications"
    if notification_uid:
        notification_url += f"?highlight={notification_uid}"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #059669 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Infestation Alert</h1>
                <p style="color: #e0f2fe; margin: 5px 0 0 0; font-size: 14px;">Palm Monitoring System</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">Dear Palm Farm Owner,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Our AI system has detected <strong style="color: #d32f2f;">signs of infestation</strong> on one of your trees:
            </p>
            
            <!-- Tree Details Box -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                <h3 style="color: #1e3a8a; margin-top: 0; font-size: 18px;">🌴 Tree Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-weight: 600;">Tree Name:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: bold;">{tree_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-weight: 600;">Group:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: bold;">{group_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-weight: 600;">Confidence:</td>
                        <td style="padding: 8px 0; color: #d32f2f; font-weight: bold; font-size: 18px;">{confidence*100:.1f}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-weight: 600;">Events Detected:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: bold;">{event_count}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Recommended Actions -->
            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">⚠️ Recommended Actions</h3>
                <ul style="color: #78350f; line-height: 1.8; margin: 10px 0;">
                    <li>Inspect the tree as soon as possible</li>
                    <li>Check for signs of red palm weevil</li>
                    <li>Contact agricultural specialist if needed</li>
                </ul>
            </div>
            
            <!-- View Details Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{notification_url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #059669 100%); 
                          color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; 
                          font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                          transition: all 0.3s ease;">
                    👉 View More Details
                </a>
                <p style="color: #666; font-size: 12px; margin-top: 10px;">
                    Click the button above to view the complete notification
                </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated message from <strong>Palm Monitoring System</strong>.<br>
                    If you have any questions, please contact support.
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """
    return send_email(to_email=user_email, subject=subject, body=body)