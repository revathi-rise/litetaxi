import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const RECIPIENT_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || 'revathimss7@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, email, and message.' },
        { status: 400 }
      );
    }

    const emailSubject = subject?.trim() || `Portfolio Inquiry from ${name}`;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    let sentVia = 'none';

    // 1. Try Nodemailer if SMTP credentials are provided in environment
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #07090e; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">New Portfolio Contact Inquiry</h1>
              <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px;">revathi.tech • Received ${timestamp} IST</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
              <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #1e293b;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Sender Details</p>
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #ffffff;">${name}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #a78bfa;"><a href="mailto:${email}" style="color: #a78bfa; text-decoration: none;">${email}</a></p>
              </div>
              <div style="margin-bottom: 18px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Subject</p>
                <p style="margin: 0; font-size: 15px; color: #f1f5f9; font-weight: 600;">${emailSubject}</p>
              </div>
              <div>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Message</p>
                <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; color: #cbd5e1; font-size: 14px; white-space: pre-wrap;">${message}</div>
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="mailto:${email}?subject=Re: ${encodeURIComponent(emailSubject)}" style="display: inline-block; background: #7c3aed; color: #ffffff; font-weight: 700; font-size: 14px; padding: 10px 22px; border-radius: 6px; text-decoration: none;">Reply Directly to ${name}</a>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Revathi.tech Portfolio" <${process.env.SMTP_USER}>`,
          to: RECIPIENT_EMAIL,
          replyTo: `"${name}" <${email}>`,
          subject: `[Portfolio Inquiry] ${emailSubject}`,
          html: htmlContent,
          text: `New Portfolio Inquiry from ${name} (${email})\nSubject: ${emailSubject}\n\nMessage:\n${message}`,
        });

        sentVia = 'nodemailer';
      } catch (smtpError) {
        console.error('[SMTP Send Error]:', smtpError);
      }
    }

    // 2. If SMTP was not configured or failed, dispatch via FormSubmit API to revathimss7@gmail.com
    if (sentVia === 'none') {
      try {
        const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: 'https://revathi.tech',
            Referer: 'https://revathi.tech/',
          },
          body: JSON.stringify({
            name,
            email,
            _subject: `[Portfolio Inquiry] ${emailSubject}`,
            message,
            _replyto: email,
            _template: 'table',
            _captcha: 'false',
          }),
        });

        const formSubmitData = await formSubmitRes.json().catch(() => null);

        if (formSubmitRes.ok && formSubmitData?.success !== 'false' && formSubmitData?.success !== false) {
          sentVia = 'formsubmit';
        } else {
          console.warn('[FormSubmit Warn]:', formSubmitData?.message || 'FormSubmit delivery issue');
        }
      } catch (formSubmitErr) {
        console.error('[FormSubmit Error]:', formSubmitErr);
      }
    }

    console.log(`[Portfolio Contact Dispatched]: From=${name} <${email}> via=${sentVia}`);

    if (sentVia === 'none') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email delivery pending one-time activation. Please verify your form or email revathimss7@gmail.com directly.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      provider: sentVia,
    });
  } catch (err: any) {
    console.error('[Contact API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}
