import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata = {
  title: 'Privacy Policy - KABPRO',
};

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly when you create an account, register an agency, or use our services. This includes your name, email address, phone number, business name, GSTIN, PAN, and fleet data such as vehicle registration numbers, driver details, trip records, fuel logs, and financial information.\n\nWe also collect usage data automatically, including IP address, browser type, device information, pages visited, and interaction patterns within the dashboard.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `Your information is used to provide and improve the KABPRO fleet management platform, including generating invoices, tracking compliance, calculating profitability, and sending alerts. We use usage data to improve performance, fix bugs, and develop new features.\n\nWe do not sell your personal or fleet data to third parties. We may share anonymized, aggregated data for analytics purposes.`,
  },
  {
    title: '3. Data Storage and Security',
    content: `All data is stored on secure servers with encryption at rest (AES-256) and in transit (TLS 1.3). We use JWT-based authentication, bcrypt password hashing, rate-limited APIs, and role-based access controls.\n\nDatabase backups are performed daily and stored in geographically distributed locations within India. We conduct regular security audits and vulnerability assessments.`,
  },
  {
    title: '4. Your Rights',
    content: `You have the right to access, correct, or delete your personal data at any time through your account settings. You can export all your fleet data in standard formats. You can request complete account deletion by contacting support.\n\nWe will respond to data requests within 30 days as required by applicable Indian data protection laws.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your account data for as long as your account is active. Fleet data, trip records, and financial logs are retained for 7 years to comply with Indian tax and accounting regulations (GST Act, Income Tax Act). You may request deletion of non-regulatory data at any time.`,
  },
  {
    title: '6. Third-Party Services',
    content: `KABPRO may integrate with third-party services for map data (OpenStreetMap/Leaflet), payment processing, and email delivery. Each third-party service has its own privacy policy. We only share the minimum data necessary for these services to function.`,
  },
  {
    title: '7. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification at least 30 days before changes take effect. Continued use of KABPRO after changes constitutes acceptance.`,
  },
  {
    title: '8. Contact',
    content: `For privacy-related questions or data requests, contact us at privacy@kabpro.in or write to: KABPRO Privacy Team, Connaught Place, New Delhi 110001, India.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted mb-12">
            Last updated: September 1, 2026
          </p>

          <div className="prose-custom flex flex-col gap-10">
            <p className="text-muted leading-relaxed">
              KABPRO (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is
              committed to protecting your privacy. This policy explains how we
              collect, use, store, and protect information when you use the
              KABPRO fleet management platform.
            </p>

            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {s.title}
                </h2>
                {s.content.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className="text-sm text-muted leading-relaxed mb-3 last:mb-0"
                  >
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
