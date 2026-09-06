import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('[/api/emails] RESEND_API_KEY is not set — cannot send email.')
      return NextResponse.json(
        { error: 'Email service is not configured. Set RESEND_API_KEY.' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)
    const { to, subject, html } = await req.json()

    // Note: To use Resend without a verified domain, you must send FROM 'onboarding@resend.dev'
    // AND you can only send TO the email address associated with your Resend account.
    const { data, error } = await resend.emails.send({
      from: 'Asian Groceries <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html || `<p>Your order has been received.</p>`,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
