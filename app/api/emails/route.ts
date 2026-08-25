import { NextResponse } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export async function POST(req: Request) {
  try {
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
