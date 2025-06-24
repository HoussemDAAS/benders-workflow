const nodemailer = require('nodemailer');

/**
 * Enterprise Email Service
 * Supports multiple email providers with fallback mechanisms
 * Scalable for serious business applications
 */
class EmailService {
  constructor() {
    this.providers = this.initializeProviders();
    this.currentProvider = 0;
  }

  /**
   * Initialize email providers in order of preference
   * Primary: AWS SES (most reliable for business)
   * Secondary: SendGrid (good deliverability)
   * Fallback: SMTP (any provider)
   */
  initializeProviders() {
    const providers = [];

    // AWS SES Provider (Recommended for production)
    if (process.env.AWS_SES_ACCESS_KEY && process.env.AWS_SES_SECRET_KEY) {
      providers.push({
        name: 'AWS SES',
        transporter: nodemailer.createTransport({
          SES: {
            aws: {
              accessKeyId: process.env.AWS_SES_ACCESS_KEY,
              secretAccessKey: process.env.AWS_SES_SECRET_KEY,
              region: process.env.AWS_SES_REGION || 'us-east-1'
            }
          }
        }),
        rateLimit: 14, // SES allows 14 emails/second by default
        dailyLimit: 200 // SES free tier
      });
    }

    // SendGrid Provider (Alternative primary)
    if (process.env.SENDGRID_API_KEY) {
      providers.push({
        name: 'SendGrid',
        transporter: nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        }),
        rateLimit: 10, // Conservative rate
        dailyLimit: 100 // SendGrid free tier
      });
    }

    // Gmail/Google Workspace (Development/Small scale)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      providers.push({
        name: 'Gmail',
        transporter: nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD // App-specific password
          }
        }),
        rateLimit: 2, // Very conservative for Gmail
        dailyLimit: 500 // Gmail daily limit
      });
    }

    // SMTP Fallback (Any SMTP provider)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      providers.push({
        name: 'SMTP',
        transporter: nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }),
        rateLimit: 5,
        dailyLimit: 1000
      });
    }

    console.log(`📧 Email Service initialized with ${providers.length} provider(s):`, 
      providers.map(p => p.name).join(', '));

    return providers;
  }

  /**
   * Send email with automatic fallback to next provider if current fails
   */
  async sendEmail(emailOptions) {
    if (this.providers.length === 0) {
      console.log('No email providers configured - logging email to console:');
      console.log('To:', emailOptions.to);
      console.log('Subject:', emailOptions.subject);
      return { success: true, provider: 'console', messageId: 'console-log' };
    }

    let lastError = null;
    
    // Try each provider in sequence
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProvider + i) % this.providers.length;
      const provider = this.providers[providerIndex];
      
      try {
        const result = await provider.transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Benders Workflow" <noreply@bendersworkflow.com>',
          ...emailOptions
        });
        
        // Update current provider to successful one
        this.currentProvider = providerIndex;
        
        return {
          success: true,
          provider: provider.name,
          messageId: result.messageId
        };
        
      } catch (error) {
        console.error(`Failed to send email via ${provider.name}:`, error.message);
        lastError = error;
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    console.error('All email providers failed. Last error:', lastError?.message);
    throw new Error(`Failed to send email: ${lastError?.message || 'All providers failed'}`);
  }

  /**
   * Send magic link email with professional template
   */
  async sendMagicLinkEmail(email, magicLink, userName = null) {
    const emailHtml = this.generateMagicLinkTemplate(magicLink, userName);
    const emailText = this.generateMagicLinkText(magicLink, userName);
    
    return await this.sendEmail({
      to: email,
      subject: 'Your secure sign-in link for Benders Workflow',
      html: emailHtml,
      text: emailText
    });
  }

  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(email, userName, isOAuthUser = false) {
    const emailHtml = this.generateWelcomeTemplate(userName, isOAuthUser);
    const emailText = this.generateWelcomeText(userName, isOAuthUser);
    
    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Benders Workflow - Get Started',
      html: emailHtml,
      text: emailText
    });
  }

  /**
   * Send 2FA enabled notification email
   */
  async send2FAEnabledEmail(email, userName) {
    const emailHtml = this.generate2FAEnabledTemplate(userName);
    const emailText = this.generate2FAEnabledText(userName);
    
    return await this.sendEmail({
      to: email,
      subject: '2FA Security Enabled - Benders Workflow',
      html: emailHtml,
      text: emailText
    });
  }

  /**
   * Send 2FA disabled notification email
   */
  async send2FADisabledEmail(email, userName) {
    const emailHtml = this.generate2FADisabledTemplate(userName);
    const emailText = this.generate2FADisabledText(userName);
    
    return await this.sendEmail({
      to: email,
      subject: '2FA Security Disabled - Benders Workflow',
      html: emailHtml,
      text: emailText
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetLink, userName = null) {
    const emailHtml = this.generatePasswordResetTemplate(resetLink, userName);
    const emailText = this.generatePasswordResetText(resetLink, userName);
    
    return await this.sendEmail({
      to: email,
      subject: 'Reset your Benders Workflow password',
      html: emailHtml,
      text: emailText
    });
  }

  /**
   * Clean magic link email template matching your exact login page UI
   */
  generateMagicLinkTemplate(magicLink, userName) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to Benders Workflow</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
        }
        .email-card { 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header { 
            text-align: center; 
            margin-bottom: 32px; 
        }
        .brand-name {
            color: #111827;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
            margin-bottom: 8px;
        }
        .brand-subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .heading { 
            color: #111827; 
            font-size: 24px; 
            font-weight: 700; 
            margin: 16px 0; 
            text-align: center; 
            letter-spacing: -0.025em;
        }
        .subtext { 
            color: #6b7280; 
            font-size: 16px; 
            text-align: center; 
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .button-container { 
            text-align: center; 
            margin: 32px 0; 
        }
        .sign-in-button { 
            display: inline-block; 
            background: linear-gradient(to right, #04082e, #030d54);
            color: white !important; 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 14px;
            letter-spacing: -0.025em;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        .sign-in-button:hover {
            background: linear-gradient(to right, rgba(4, 8, 46, 0.9), rgba(3, 13, 84, 0.9));
            color: white !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        .security-box { 
            background: #f3f4f6; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 24px 0; 
            color: #374151; 
            font-size: 14px;
            line-height: 1.5;
        }
        .security-box strong {
            color: #111827;
        }
        .link-fallback {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 12px;
            color: #6b7280;
            word-break: break-all;
            text-align: center;
        }
        .footer { 
            text-align: center; 
            color: #9ca3af; 
            font-size: 14px; 
            margin-top: 32px; 
            padding-top: 24px; 
            border-top: 1px solid #e5e7eb; 
        }
        .footer strong {
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container { padding: 24px 16px; }
            .email-card { padding: 24px; }
            .heading { font-size: 20px; }
            .sign-in-button { padding: 10px 20px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <div class="brand-name">Benders Workflow</div>
                <div class="brand-subtitle">Business Process Management</div>
            </div>
            
            <h1 class="heading">Welcome back</h1>
            <p class="subtext">
                ${userName ? `Hi ${userName}, c` : 'C'}lick the button below to securely sign in to your account.
            </p>
            
            <div class="button-container">
                <a href="${magicLink}" class="sign-in-button">Sign In Securely</a>
            </div>
            
            <div class="security-box">
                <strong>Security Notice:</strong> This link will expire in 15 minutes and can only be used once. If you didn't request this sign-in, you can safely ignore this email.
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                Having trouble with the button? Copy and paste this link:
            </p>
            <div class="link-fallback">
                ${magicLink}
            </div>
            
            <div class="footer">
                <p><strong>Benders Workflow</strong></p>
                <p style="margin-top: 4px;">© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Clean plain text version of magic link email
   */
  generateMagicLinkText(magicLink, userName) {
    return `
BENDERS WORKFLOW

Welcome back

${userName ? `Hi ${userName}, c` : 'C'}lick the link below to securely sign in to your account:

${magicLink}

SECURITY NOTICE:
This link will expire in 15 minutes and can only be used once.
If you didn't request this sign-in, you can safely ignore this email.

---
Benders Workflow
© ${new Date().getFullYear()} All rights reserved.
`;
  }

  /**
   * Clean welcome email template matching your exact login page UI
   */
  generateWelcomeTemplate(userName, isOAuthUser) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Benders Workflow</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .email-card { 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header { text-align: center; margin-bottom: 32px; }
        .brand-name {
            color: #111827;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
            margin-bottom: 8px;
        }
        .brand-subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .heading { 
            color: #111827; 
            font-size: 24px; 
            font-weight: 700; 
            margin: 16px 0; 
            text-align: center; 
            letter-spacing: -0.025em;
        }
        .welcome-text {
            color: #6b7280;
            font-size: 16px;
            text-align: center;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .features { 
            margin: 32px 0;
        }
        .feature-item { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb;
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 16px;
        }
        .feature-title { 
            font-weight: 600; 
            color: #111827; 
            margin-bottom: 8px; 
            font-size: 16px;
        }
        .feature-desc {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }
        .button-container { text-align: center; margin: 32px 0; }
        .get-started-button { 
            display: inline-block; 
            background: linear-gradient(to right, #04082e, #030d54);
            color: white !important; 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 14px;
            letter-spacing: -0.025em;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        .get-started-button:hover {
            background: linear-gradient(to right, rgba(4, 8, 46, 0.9), rgba(3, 13, 84, 0.9));
            color: white !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        .footer { 
            text-align: center; 
            color: #9ca3af; 
            font-size: 14px; 
            margin-top: 32px; 
            padding-top: 24px; 
            border-top: 1px solid #e5e7eb; 
        }
        .footer strong {
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container { padding: 24px 16px; }
            .email-card { padding: 24px; }
            .heading { font-size: 20px; }
            .get-started-button { padding: 10px 20px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <div class="brand-name">Benders Workflow</div>
                <div class="brand-subtitle">Business Process Management</div>
            </div>
            
            <h1 class="heading">Welcome to Benders Workflow</h1>
            <p class="welcome-text">
                Hi ${userName}, welcome to the future of business process management.
            </p>
            
            <div class="features">
                <div class="feature-item">
                    <div class="feature-title">Workflow Management</div>
                    <div class="feature-desc">Design and automate complex business processes with our visual workflow builder.</div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-title">Real-time Analytics</div>
                    <div class="feature-desc">Track performance and get insights with comprehensive dashboards and reporting.</div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-title">Team Collaboration</div>
                    <div class="feature-desc">Collaborate effortlessly with your team and manage projects efficiently.</div>
                </div>
            </div>
            
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="get-started-button">Get Started</a>
            </div>
            
            <div class="footer">
                <p><strong>Benders Workflow</strong></p>
                <p style="margin-top: 4px;">© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Welcome email plain text
   */
  generateWelcomeText(userName, isOAuthUser) {
    return `
Welcome to Benders Workflow!

Hi ${userName},

Welcome to the future of business process management.

What you can do with Benders Workflow:

🔄 Workflow Management
Design and automate complex business processes with our visual workflow builder.

📊 Real-time Analytics  
Track performance and get insights with comprehensive dashboards and reporting.

👥 Team Collaboration
Seamlessly collaborate with your team and manage projects efficiently.

Get started: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

Need help getting started? Contact our support team anytime.

Best regards,
The Benders Workflow Team

© ${new Date().getFullYear()} Benders Workflow. All rights reserved.
`;
  }

  /**
   * Password reset email template
   */
  generatePasswordResetTemplate(resetLink, userName) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
        .heading { color: #1a202c; font-size: 24px; font-weight: 600; margin: 20px 0; text-align: center; }
        .subheading { color: #4a5568; font-size: 16px; margin-bottom: 30px; text-align: center; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; }
        .cta-container { text-align: center; margin: 30px 0; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .security-note { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #b91c1c; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="logo">
                <div class="logo-icon">BW</div>
            </div>
            
            <h1 class="heading">Reset your password</h1>
            <p class="subheading">
                ${userName ? `Hi ${userName},` : 'Hello,'}<br>
                We received a request to reset your password for your Benders Workflow account.
            </p>
            
            <div class="cta-container">
                <a href="${resetLink}" class="cta-button">Reset Password</a>
            </div>
            
            <div class="security-note">
                🔒 <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email - your account is secure.
            </div>
            
            <div class="footer">
                <p>This email was sent by Benders Workflow<br>
                If you have any questions, contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Benders Workflow. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Password reset plain text
   */
  generatePasswordResetText(resetLink, userName) {
    return `
Reset your password

${userName ? `Hi ${userName},` : 'Hello,'}

We received a request to reset your password for your Benders Workflow account.

Click the link below to reset your password:

${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email - your account is secure.

Best regards,
The Benders Workflow Team

© ${new Date().getFullYear()} Benders Workflow. All rights reserved.
`;
  }

  /**
   * 2FA enabled email template - Updated to match magic link template style
   */
  generate2FAEnabledTemplate(userName) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Security Enabled - Benders Workflow</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
        }
        .email-card { 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header { 
            text-align: center; 
            margin-bottom: 32px; 
        }
        .brand-name {
            color: #111827;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
            margin-bottom: 8px;
        }
        .brand-subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .security-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(to right, #10b981, #059669);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 24px;
        }
        .heading { 
            color: #111827; 
            font-size: 24px; 
            font-weight: 700; 
            margin: 16px 0; 
            text-align: center; 
            letter-spacing: -0.025em;
        }
        .subtext { 
            color: #6b7280; 
            font-size: 16px; 
            text-align: center; 
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .security-box { 
            background: #ecfdf5; 
            border: 1px solid #d1fae5; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 24px 0; 
            color: #374151; 
            font-size: 14px;
            line-height: 1.5;
        }
        .security-box strong {
            color: #065f46;
        }
        .info-box { 
            background: #f3f4f6; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 24px 0; 
            color: #374151; 
            font-size: 14px;
            line-height: 1.5;
        }
        .info-box strong {
            color: #111827;
        }
        .button-container { 
            text-align: center; 
            margin: 32px 0; 
        }
        .dashboard-button { 
            display: inline-block; 
            background: linear-gradient(to right, #04082e, #030d54);
            color: white !important; 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 14px;
            letter-spacing: -0.025em;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        .dashboard-button:hover {
            background: linear-gradient(to right, rgba(4, 8, 46, 0.9), rgba(3, 13, 84, 0.9));
            color: white !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        .footer { 
            text-align: center; 
            color: #9ca3af; 
            font-size: 14px; 
            margin-top: 32px; 
            padding-top: 24px; 
            border-top: 1px solid #e5e7eb; 
        }
        .footer strong {
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container { padding: 24px 16px; }
            .email-card { padding: 24px; }
            .heading { font-size: 20px; }
            .dashboard-button { padding: 10px 20px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <div class="brand-name">Benders Workflow</div>
                <div class="brand-subtitle">Business Process Management</div>
                <div class="security-icon">🛡️</div>
            </div>
            
            <h1 class="heading">2FA Security Enabled</h1>
            <p class="subtext">
                Hi ${userName}, two-factor authentication has been successfully enabled for your account.
            </p>
            
            <div class="security-box">
                <strong>Enhanced Security Active:</strong> Your account is now protected with two-factor authentication. You'll need both your password and a code from your authenticator app to sign in.
            </div>

            <div class="info-box">
                <strong>Important Reminders:</strong><br>
                • Keep your backup codes in a safe place<br>
                • Don't share your authenticator app with others<br>
                • Contact support if you lose access to your authenticator
            </div>
            
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="dashboard-button">Go to Dashboard</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                If you didn't enable 2FA, please contact our security team immediately.
            </p>
            
            <div class="footer">
                <p><strong>Benders Workflow</strong></p>
                <p style="margin-top: 4px;">© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 2FA enabled plain text
   */
  generate2FAEnabledText(userName) {
    return `
BENDERS WORKFLOW - SECURITY NOTIFICATION

2FA Security Enabled

Hi ${userName},

Two-factor authentication has been successfully enabled for your account.

ENHANCED SECURITY:
Your account is now more secure with 2FA enabled. You'll need both your password and a code from your authenticator app to sign in.

IMPORTANT REMINDERS:
• Keep your backup codes in a safe place
• Don't share your authenticator app with others  
• Contact support if you lose access to your authenticator

If you didn't enable 2FA, please contact our security team immediately.

Best regards,
Benders Workflow Security Team

© ${new Date().getFullYear()} Benders Workflow. All rights reserved.
`;
  }

  /**
   * 2FA disabled email template - Updated to match magic link template style
   */
  generate2FADisabledTemplate(userName) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Security Disabled - Benders Workflow</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
        }
        .email-card { 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header { 
            text-align: center; 
            margin-bottom: 32px; 
        }
        .brand-name {
            color: #111827;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
            margin-bottom: 8px;
        }
        .brand-subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .warning-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(to right, #f59e0b, #d97706);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 24px;
        }
        .heading { 
            color: #111827; 
            font-size: 24px; 
            font-weight: 700; 
            margin: 16px 0; 
            text-align: center; 
            letter-spacing: -0.025em;
        }
        .subtext { 
            color: #6b7280; 
            font-size: 16px; 
            text-align: center; 
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .warning-box {
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            color: #374151;
            font-size: 14px;
            line-height: 1.5;
        }
        .warning-box strong {
            color: #92400e;
        }
        .info-box { 
            background: #f3f4f6; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 24px 0; 
            color: #374151; 
            font-size: 14px;
            line-height: 1.5;
        }
        .info-box strong {
            color: #111827;
        }
        .button-container { 
            text-align: center; 
            margin: 32px 0; 
        }
        .re-enable-button { 
            display: inline-block; 
            background: linear-gradient(to right, #04082e, #030d54);
            color: white !important; 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 14px;
            letter-spacing: -0.025em;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        .re-enable-button:hover {
            background: linear-gradient(to right, rgba(4, 8, 46, 0.9), rgba(3, 13, 84, 0.9));
            color: white !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        .footer { 
            text-align: center; 
            color: #9ca3af; 
            font-size: 14px; 
            margin-top: 32px; 
            padding-top: 24px; 
            border-top: 1px solid #e5e7eb; 
        }
        .footer strong {
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container { padding: 24px 16px; }
            .email-card { padding: 24px; }
            .heading { font-size: 20px; }
            .re-enable-button { padding: 10px 20px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <div class="brand-name">Benders Workflow</div>
                <div class="brand-subtitle">Business Process Management</div>
                <div class="warning-icon">⚠️</div>
            </div>
            
            <h1 class="heading">2FA Security Disabled</h1>
            <p class="subtext">
                Hi ${userName}, two-factor authentication has been disabled for your account.
            </p>
            
            <div class="warning-box">
                <strong>Security Level Reduced:</strong> Your account is now less secure without 2FA. We strongly recommend re-enabling two-factor authentication to protect your account from unauthorized access.
            </div>
            
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/security" class="re-enable-button">Re-enable 2FA</a>
            </div>

            <div class="info-box">
                <strong>Didn't Disable 2FA?</strong><br>
                If you didn't disable 2FA, your account may be compromised. Please contact our security team immediately and change your password.
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                Need help? Contact our security team anytime.
            </p>
            
            <div class="footer">
                <p><strong>Benders Workflow</strong></p>
                <p style="margin-top: 4px;">© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 2FA disabled plain text
   */
  generate2FADisabledText(userName) {
    return `
BENDERS WORKFLOW - SECURITY NOTIFICATION

2FA Security Disabled

Hi ${userName},

Two-factor authentication has been disabled for your account.

WARNING - SECURITY LEVEL REDUCED:
Your account is now less secure without 2FA. We strongly recommend re-enabling two-factor authentication to protect your account.

Re-enable 2FA: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/security

DIDN'T DISABLE 2FA?
If you didn't disable 2FA, your account may be compromised. Please:
• Contact our security team immediately
• Change your password
• Re-enable 2FA

Best regards,
Benders Workflow Security Team

© ${new Date().getFullYear()} Benders Workflow. All rights reserved.
`;
  }

  /**
   * Health check for email service
   */
  async healthCheck() {
    const results = [];
    
    for (const provider of this.providers) {
      try {
        await provider.transporter.verify();
        results.push({ provider: provider.name, status: 'healthy' });
      } catch (error) {
        results.push({ provider: provider.name, status: 'error', error: error.message });
      }
    }
    
    return {
      totalProviders: this.providers.length,
      results
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;