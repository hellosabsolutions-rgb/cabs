import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata = {
  title: 'Cookie Policy - KABPRO',
};

const cookies = [
  {
    name: 'kabpro-theme',
    type: 'Functional',
    duration: 'Persistent',
    purpose:
      'Stores your preferred color theme (light or dark mode) so it persists across visits.',
  },
  {
    name: 'kabpro-session',
    type: 'Essential',
    duration: 'Session',
    purpose:
      'Maintains your authenticated session while using the KABPRO dashboard. Required for the app to function.',
  },
  {
    name: 'kabpro-agency',
    type: 'Functional',
    duration: 'Persistent',
    purpose:
      'Remembers your last selected agency in multi-agency setups for faster access.',
  },
  {
    name: 'kabpro-consent',
    type: 'Essential',
    duration: '1 year',
    purpose:
      'Records your cookie consent preference so we do not ask again on every visit.',
  },
];

const sections = [
  {
    title: 'What Are Cookies',
    content:
      'Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience. KABPRO uses a minimal set of cookies, all functional or essential to operating the platform.',
  },
  {
    title: 'How We Use Cookies',
    content:
      'We use cookies exclusively for session management, preference storage, and platform functionality. We do not use tracking cookies, advertising cookies, or share cookie data with third-party advertisers.',
  },
  {
    title: 'Managing Cookies',
    content:
      'You can control cookies through your browser settings. Disabling essential cookies may prevent parts of KABPRO from functioning correctly. The theme preference cookie can be deleted at any time without affecting functionality beyond resetting your color scheme to the system default.',
  },
  {
    title: 'Changes to This Policy',
    content:
      'We may update this Cookie Policy if we introduce new cookies. We will update the "last updated" date and notify you of significant changes via email or in-app notification.',
  },
  {
    title: 'Contact',
    content:
      'For questions about our cookie practices, contact privacy@kabpro.in.',
  },
];

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground mb-2">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted mb-12">
            Last updated: September 1, 2026
          </p>

          <div className="flex flex-col gap-10">
            {sections.slice(0, 2).map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {s.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {s.content}
                </p>
              </div>
            ))}

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Cookies We Use
              </h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-elevated text-left">
                      <th className="px-4 py-3 font-medium text-foreground">
                        Cookie
                      </th>
                      <th className="px-4 py-3 font-medium text-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 font-medium text-foreground">
                        Duration
                      </th>
                      <th className="px-4 py-3 font-medium text-foreground">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookies.map((c) => (
                      <tr
                        key={c.name}
                        className="border-t border-border"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-accent">
                          {c.name}
                        </td>
                        <td className="px-4 py-3 text-muted">{c.type}</td>
                        <td className="px-4 py-3 text-muted">{c.duration}</td>
                        <td className="px-4 py-3 text-muted">{c.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {sections.slice(2).map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {s.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
