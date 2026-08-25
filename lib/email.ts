// lib/email.ts — Transactional emails via Resend
// Docs: https://resend.com/docs
// Setup: npm install resend   +   RESEND_API_KEY in .env.local

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'FoodCulture AI <hello@foodculture.ai>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[email] Resend error:', err)
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FoodCulture AI</title></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ede8e2">
  <tr><td style="background:#E85D26;padding:20px 32px">
    <a href="${BASE_URL}" style="font-size:20px;font-weight:700;color:#fff;text-decoration:none">FoodCulture AI</a>
  </td></tr>
  <tr><td style="padding:32px">${content}</td></tr>
  <tr><td style="padding:16px 32px;background:#f5f0eb;font-size:12px;color:#888;text-align:center">
    © 2026 FoodCulture AI · Bengaluru, India<br>
    <a href="${BASE_URL}" style="color:#E85D26;text-decoration:none">Visit FoodCulture AI</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

// ─── 1. Welcome email on signup ───────────────────────────────────────────────

export async function sendWelcomeEmail({ to, name, role }: { to: string; name: string; role: string }) {
  const isOwner = role === 'owner'
  const html = baseLayout(`
    <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px">Welcome to FoodCulture AI${name ? `, ${name}` : ''}! 🎉</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">
      ${isOwner
        ? "You're all set to list your restaurant and connect with Bengaluru's top food influencers."
        : "You can now discover trending restaurants, save your favourites, and connect with Bengaluru's food scene."}
    </p>
    <a href="${BASE_URL}${isOwner ? '/onboarding' : '/explore'}" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none">
      ${isOwner ? 'Set up your listing →' : 'Explore Bengaluru →'}
    </a>
  `)
  await send(to, 'Welcome to FoodCulture AI 🔥', html)
}

// ─── 2. Listing submitted for review ─────────────────────────────────────────

export async function sendListingSubmittedEmail({ to, name, restaurantName }: { to: string; name: string; restaurantName: string }) {
  const html = baseLayout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">Listing submitted for review ✓</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px">
      Hi ${name}, we've received your listing for <strong>${restaurantName}</strong>.
      Our team will review it within <strong>24–48 hours</strong>. You'll get an email when it goes live.
    </p>
    <div style="background:#FEF9F6;border:1px solid #f5d5c0;border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-size:13px;color:#555">While you wait:</div>
      <ul style="font-size:13px;color:#555;margin:8px 0;padding-left:20px;line-height:2">
        <li>Add more photos to your listing</li>
        <li>Browse influencers to connect with</li>
        <li>Check out trending restaurants for inspiration</li>
      </ul>
    </div>
    <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none">
      Go to dashboard →
    </a>
  `)
  await send(to, `Your listing "${restaurantName}" is under review`, html)
}

// ─── 3. Listing approved ──────────────────────────────────────────────────────

export async function sendListingApprovedEmail({ to, name, restaurantName, restaurantSlug }: { to: string; name: string; restaurantName: string; restaurantSlug: string }) {
  const html = baseLayout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">🎉 Your listing is live!</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px">
      Hi ${name}, <strong>${restaurantName}</strong> has been approved and is now live on FoodCulture AI.
      Bengaluru food lovers can discover your restaurant right now.
    </p>
    <div style="display:flex;gap:12px;margin-bottom:24px">
      <a href="${BASE_URL}/restaurants/${restaurantSlug}" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 24px;font-size:14px;font-weight:600;text-decoration:none">
        View your listing →
      </a>
      <a href="${BASE_URL}/influencers" style="display:inline-block;background:#fff;border:1px solid #ede8e2;color:#1a1a1a;border-radius:24px;padding:12px 24px;font-size:14px;text-decoration:none">
        Connect with influencers
      </a>
    </div>
  `)
  await send(to, `✅ "${restaurantName}" is now live on FoodCulture AI`, html)
}

// ─── 4. Listing rejected ──────────────────────────────────────────────────────

export async function sendListingRejectedEmail({ to, name, restaurantName, reason }: { to: string; name: string; restaurantName: string; reason?: string }) {
  const html = baseLayout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">Your listing needs some changes</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px">
      Hi ${name}, we were unable to approve <strong>${restaurantName}</strong> at this time.
    </p>
    ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px;margin-bottom:16px;font-size:13px;color:#555"><strong>Reason:</strong> ${reason}</div>` : ''}
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">
      Please update your listing and resubmit. If you have questions, reply to this email.
    </p>
    <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none">
      Edit and resubmit →
    </a>
  `)
  await send(to, `Action required: "${restaurantName}" listing update needed`, html)
}

// ─── 5. New enquiry notification to restaurant owner ─────────────────────────

export async function sendNewEnquiryEmail({ to, ownerName, restaurantName, senderName, senderEmail, message }: { to: string; ownerName: string; restaurantName: string; senderName: string; senderEmail: string; message: string }) {
  const html = baseLayout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">📬 New enquiry for ${restaurantName}</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px">Hi ${ownerName}, you have a new enquiry from <strong>${senderName}</strong>.</p>
    <div style="background:#fafafa;border:1px solid #ede8e2;border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-size:12px;color:#888;margin-bottom:4px">From</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:2px">${senderName}</div>
      <a href="mailto:${senderEmail}" style="font-size:13px;color:#E85D26">${senderEmail}</a>
      <div style="font-size:12px;color:#888;margin-top:12px;margin-bottom:4px">Message</div>
      <div style="font-size:14px;color:#333;line-height:1.6">${message}</div>
    </div>
    <a href="${BASE_URL}/dashboard/enquiries" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none">
      View and reply →
    </a>
  `)
  await send(to, `New enquiry for ${restaurantName} from ${senderName}`, html)
}

// ─── 6. Enquiry confirmation to the person who sent it ───────────────────────

export async function sendEnquiryConfirmationEmail({ to, senderName, restaurantName }: { to: string; senderName: string; restaurantName: string }) {
  const html = baseLayout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">We've sent your enquiry ✓</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px">
      Hi ${senderName}, your message to <strong>${restaurantName}</strong> has been delivered.
      They'll get back to you within 24 hours.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">
      While you wait, explore more restaurants near you.
    </p>
    <a href="${BASE_URL}/restaurants" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none">
      Explore restaurants →
    </a>
  `)
  await send(to, `Your enquiry to ${restaurantName} has been sent`, html)
}

// ─── 7. Connection request notification to influencer ────────────────────────

export async function sendConnectionRequestEmail({ to, influencerName, restaurantName, requesterName }: { to: string; influencerName: string; restaurantName: string; requesterName: string }) {
  const html = baseLayout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">✨ New collaboration request</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px">
      Hi ${influencerName}, <strong>${restaurantName}</strong> wants to collaborate with you!
    </p>
    <div style="background:#FEF9F6;border:1px solid #f5d5c0;border-radius:12px;padding:16px;margin-bottom:20px;font-size:14px;color:#555">
      <strong>Contact:</strong> ${requesterName}
    </div>
    <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#E85D26;color:#fff;border-radius:24px;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none">
      View request →
    </a>
  `)
  await send(to, `${restaurantName} wants to collaborate with you on FoodCulture AI`, html)
}
