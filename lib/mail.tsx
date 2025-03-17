import { Resend } from 'resend'
import { render } from '@react-email/render'
import NewQuoteEmail from '../emails/NewQuoteEmail'
import EmailTrackingService from "./services/tracking/email-tracking.service";

const resend = new Resend(process.env.RESEND_API_KEY)
const domain = process.env.NEXT_PUBLIC_APP_URL

export async function sendVerificationEmail(
  email: string,
  token: string,
) {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`

  await resend.emails.send({
    from: 'gulfquotes <onboarding@gulfquotes.ae>',
    to: email,
    subject: 'Confirm your email',
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`
  })
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
) {
  const resetLink = `${domain}/auth/new-password?token=${token}`

  await resend.emails.send({
    from: 'gulfquotes <support@gulfquotes.ae>',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
  })
}

export async function sendTwoFactorTokenEmail(
  email: string,
  token: string,
) {
  await resend.emails.send({
    from: 'gulfquotes <support@gulfquotes.ae>',
    to: email,
    subject: '2FA Code',
    html: `<p>Your 2FA Code: ${token}</p>`
  })
}

/**
 * Send an email notification when an author a user follows posts a new quote
 */
export async function sendNewQuoteEmail(
  email: string,
  recipientName: string,
  quoteContent: string,
  quoteId: string,
  authorName: string,
  authorSlug: string,
) {
  // Generate URLs
  const quoteUrl = `${domain}/quotes/${quoteId}`;
  const authorProfileUrl = `${domain}/authors/${authorSlug}`;
  const unsubscribeUrl = `${domain}/users/settings/notifications`;
  const preferencesUrl = `${domain}/users/settings/notifications`;

  const subject = `New Quote from ${authorName} on gulfquotes`;
  
  // Sanitize the author name for tags - replace non-alphanumeric chars with underscores
  const sanitizedAuthorName = authorName.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  const tags = [
    { name: 'notification_type', value: 'new_quote' },
    { name: 'author', value: sanitizedAuthorName }
  ];

  try {
    // Log before rendering
    console.log("Rendering email template for", email);
    
    // Render the React Email template to HTML
    const html = await render(
      <NewQuoteEmail 
        recipientName={recipientName}
        quoteContent={quoteContent}
        quoteUrl={quoteUrl}
        authorName={authorName}
        authorProfileUrl={authorProfileUrl}
        unsubscribeUrl={unsubscribeUrl}
        preferencesUrl={preferencesUrl}
      />
    );
    
    console.log("Template rendered successfully, sending email...");
    
    // Send the email
    const result = await resend.emails.send({
      from: 'gulfquotes <notification@gulfquotes.ae>',
      to: email,
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`
      },
      tags
    });
    
    console.log("Email API response:", result);
    
    // Track the successful send
    await EmailTrackingService.trackEmailSend(
      email, 
      undefined,
      subject,
      tags
    );
    
    return result;
  } catch (error) {
    // Detailed error logging
    console.error("EMAIL SENDING ERROR:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    
    // Track the error
    await EmailTrackingService.trackDeliveryError(
      email,
      error,
      tags
    );
    throw error; // Re-throw so the caller can handle it
  }
}