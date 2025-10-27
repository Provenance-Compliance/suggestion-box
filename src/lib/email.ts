import * as brevo from '@getbrevo/brevo';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

/**
 * Initialize the Brevo API client
 */
function initializeBrevo() {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY is not set. Email notifications will be disabled.');
    return null;
  }

  // Validate API key format
  if (!process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
    console.error('Invalid BREVO_API_KEY format. Key should start with "xkeysib-"');
    return null;
  }

  try {
    const api = new brevo.TransactionalEmailsApi();
    api.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    return api;
  } catch (error) {
    console.error('Error initializing Brevo client:', error);
    return null;
  }
}

/**
 * Send an email notification when a new suggestion is created
 */
export async function sendSuggestionNotification(
  suggestion: {
    title: string;
    content: string;
    category: string;
    submittedBy: string;
    isAnonymous: boolean;
  }
): Promise<void> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('Email notifications disabled: BREVO_API_KEY not set');
      return;
    }

    if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
      console.log('Email notifications disabled: ADMIN_NOTIFICATION_EMAIL not set');
      return;
    }

    if (!process.env.SENDER_EMAIL) {
      console.log('Email notifications disabled: SENDER_EMAIL not set');
      return;
    }

    if (!apiInstance) {
      apiInstance = initializeBrevo();
    }

    if (!apiInstance) {
      return;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Email configuration
    sendSmtpEmail.subject = `New Suggestion: ${suggestion.title}`;
    
    // Email content with HTML template
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Suggestion</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center; background-color: #4bdcf5;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Innovation Hub</h1>
              </td>
            </tr>
          </table>
          
          <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; margin-top: 20px;">
            <tr>
              <td style="padding: 20px;">
                <h2 style="margin: 0 0 10px 0; color: #333333; font-size: 20px;">New Suggestion Received</h2>
                <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px;">
                  A new suggestion has been submitted to the Innovation Hub.
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 0 20px;">
                <div style="background-color: #f9f9f9; border-left: 4px solid #4bdcf5; padding: 15px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">${suggestion.title}</h3>
                  <p style="margin: 0; color: #666666; font-size: 14px; white-space: pre-wrap;">${suggestion.content}</p>
                </div>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 0 20px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 10px; background-color: #f0f0f0; border-bottom: 1px solid #dddddd;">
                      <strong style="color: #333333; font-size: 14px;">Category:</strong>
                    </td>
                    <td style="padding: 10px; background-color: #f0f0f0; border-bottom: 1px solid #dddddd;">
                      <span style="color: #666666; font-size: 14px;">${suggestion.category}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; border-bottom: 1px solid #dddddd;">
                      <strong style="color: #333333; font-size: 14px;">Submitted By:</strong>
                    </td>
                    <td style="padding: 10px; background-color: #f9f9f9; border-bottom: 1px solid #dddddd;">
                      <span style="color: #666666; font-size: 14px;">${suggestion.isAnonymous ? 'Anonymous' : suggestion.submittedBy}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f0f0f0;">
                      <strong style="color: #333333; font-size: 14px;">Submission Type:</strong>
                    </td>
                    <td style="padding: 10px; background-color: #f0f0f0;">
                      <span style="color: #666666; font-size: 14px;">${suggestion.isAnonymous ? 'Anonymous' : 'Identified'}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; color: #999999; font-size: 12px;">
                  This is an automated notification from Innovation Hub.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    sendSmtpEmail.sender = {
      name: 'Innovation Hub',
      email: process.env.SENDER_EMAIL || 'noreply@provenance.com',
    };

    sendSmtpEmail.to = [
      {
        email: process.env.ADMIN_NOTIFICATION_EMAIL,
        name: 'Admin Team',
      },
    ];

    if (process.env.SENDER_EMAIL) {
      sendSmtpEmail.replyTo = {
        email: process.env.SENDER_EMAIL,
        name: 'Innovation Hub',
      };
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Suggestion notification email sent successfully');
  } catch (error) {
    console.error('Error sending suggestion notification email:', error);
    // Don't throw error - email sending failure shouldn't prevent suggestion creation
  }
}

