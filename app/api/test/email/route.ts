// app/api/test/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from 'resend';

export async function GET() {
  try {
    // Create a new Resend instance using the API key from env
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Log the API key (first few characters) to verify it's loaded
    console.log("Using API key starting with:", process.env.RESEND_API_KEY?.substring(0, 5));
    
    // Try a simple text-only email to avoid React template issues
    const result = await resend.emails.send({
      from: 'gulfquotes <support@gulfquotes.ae>',
      to: 'chinedu02k@gmail.com', // Your email address
      subject: 'Test Email - API Debug',
      text: 'This is a plain text email to debug the API connection.',
    });
    
    console.log("Email sending result:", result);
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    // Detailed error logging
    console.error("EMAIL TEST ERROR:", error);
    
    // Return the error details for debugging
    return NextResponse.json({ 
      error: true,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}