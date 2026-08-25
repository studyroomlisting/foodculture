import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'FoodCulture AI Terms of Service',
}

export default function TermsPage() {
  const sections = [
    { title: '1. Acceptance of terms', body: 'By accessing or using FoodCulture AI ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.' },
    { title: '2. Description of service', body: 'FoodCulture AI is a food intelligence and influencer marketplace platform focused on Bengaluru, India. We connect restaurants with food content creators and provide food discovery services to visitors.' },
    { title: '3. User accounts', body: 'You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information when creating your account.' },
    { title: '4. Restaurant listings', body: 'Restaurant owners may list their restaurants on the Platform subject to our review and approval process. Listings must be accurate and not misleading. We reserve the right to approve, reject, or remove any listing at our discretion.' },
    { title: '5. User content', body: 'You retain ownership of content you submit (reviews, photos, messages). By submitting content, you grant us a non-exclusive, worldwide licence to use, display, and distribute that content in connection with the Platform.' },
    { title: '6. Prohibited conduct', body: 'You may not use the Platform to post false information, spam, or harass other users. You may not attempt to circumvent our authentication systems or access data you are not authorised to view.' },
    { title: '7. Connection fees', body: 'Certain features, including influencer connections, may require payment of a connection fee. All fees are clearly disclosed before any charge is made. Fees are non-refundable except as required by law.' },
    { title: '8. Disclaimers', body: 'The Platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy of AI-generated intelligence scores or trend data. Restaurant information may change without notice.' },
    { title: '9. Limitation of liability', body: 'To the maximum extent permitted by law, FoodCulture AI shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform.' },
    { title: '10. Changes to terms', body: 'We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms. We will notify users of material changes by email.' },
    { title: '11. Governing law', body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Bengaluru, Karnataka.' },
    { title: '12. Contact', body: 'For questions about these Terms, contact us at legal@foodculture.ai.' },
  ]
  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>Last updated: July 2026</p>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.title}</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0 }}>{s.body}</p>
          </div>
        ))}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #ede8e2', fontSize: 13, color: '#aaa' }}>
          <Link href="/privacy" style={{ color: '#E85D26', textDecoration: 'none' }}>Privacy Policy</Link>
          {' · '}
          <Link href="/" style={{ color: '#E85D26', textDecoration: 'none' }}>Back to FoodCulture AI</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
