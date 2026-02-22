import Link from 'next/link';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { ThemeShell } from './theme-shell';
import { LiveStats } from '@/ui/components/live-stats';

const plans = [
  { name: 'Aurora', range: '$100 - $999', roi: '1.9% / day', term: '30 days', perks: ['Daily rewards', 'Auto compounding', 'Priority support'] },
  { name: 'Solstice', range: '$1,000 - $4,999', roi: '2.4% / day', term: '45 days', perks: ['Higher ROI', 'Faster withdrawals', 'Dedicated manager'] },
  { name: 'Equinox', range: '$5,000 - $14,999', roi: '3.0% / day', term: '60 days', perks: ['VIP reports', 'Multi-wallet', 'Custom alerts'] },
  { name: 'Zenith', range: '$15,000+', roi: '3.8% / day', term: '90 days', perks: ['Treasury desk', 'Premium routing', '24/7 support'] }
];

const features = [
  { title: 'Ledger-native finance', desc: 'Every movement is double‑entry, auditable, and irreversible in logs.' },
  { title: 'Automated compliance', desc: 'KYC, risk scoring, and approval flows for safer operations.' },
  { title: 'Reward orchestration', desc: 'Daily ROI + referral payouts, scheduled and traceable.' },
  { title: 'Operational control', desc: 'Admin console with approvals, exports, and audit trails.' },
  { title: 'Smart routing', desc: 'Multiple gateways with adaptive settlement paths.' },
  { title: 'Real-time telemetry', desc: 'Live stats, alerts, and status snapshots in seconds.' }
];

const steps = [
  { title: 'Open an account', desc: 'Create a verified profile in minutes.' },
  { title: 'Fund your wallet', desc: 'Deposit by bank, card, or crypto.' },
  { title: 'Select a plan', desc: 'Choose ROI cadence and term length.' },
  { title: 'Earn daily', desc: 'Rewards credited automatically.' }
];

const testimonials = [
  { name: 'Ava Thompson', role: 'Portfolio Lead', quote: 'The daily reward engine is the cleanest I have used. Everything is transparent.' },
  { name: 'James Carter', role: 'Growth Operator', quote: 'We manage approvals and payouts in one place. Reporting is flawless.' },
  { name: 'Maya Singh', role: 'Ops Director', quote: 'The admin console makes audits painless. The ledger trail is rock solid.' }
];

const faqs = [
  { q: 'How fast is verification?', a: 'Most reviews are completed within 24 hours.' },
  { q: 'When do rewards arrive?', a: 'Rewards are posted daily and visible in your ledger.' },
  { q: 'Can I withdraw anytime?', a: 'Withdrawals are available after KYC approval.' },
  { q: 'Is my capital protected?', a: 'We enforce 2FA, rate limits, and ledger audits.' }
];

const colorfulCardSkins = [
  'bg-gradient-to-br from-white/14 via-sky-200/10 to-blue-200/10',
  'bg-gradient-to-br from-white/14 via-indigo-200/10 to-violet-200/10',
  'bg-gradient-to-br from-white/14 via-cyan-200/10 to-emerald-200/8',
  'bg-gradient-to-br from-white/14 via-slate-200/10 to-blue-100/8'
] as const;

export default function HomePage() {
  return (
    <ThemeShell>
      <main className="min-h-screen bg-[linear-gradient(135deg,#0c1628_0%,#132444_35%,#1a3460_65%,#234377_100%)] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/2 top-[-110px] h-[840px] w-[840px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(191,219,254,0.20),_rgba(129,140,248,0.10),_transparent_72%)]" />
          <div className="absolute right-[-150px] top-[20px] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.18),_transparent_74%)]" />
          <div className="absolute left-[-170px] bottom-[80px] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,_rgba(196,181,253,0.14),_transparent_76%)]" />
          <div className="absolute bottom-[-120px] right-[8%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,_rgba(186,230,253,0.14),_transparent_78%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.12),transparent_38%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)]" />
        </div>

        <header className="sticky top-0 z-50 border-b border-white/15 bg-gradient-to-r from-[#132544]/88 via-[#18335d]/84 to-[#24497d]/84 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/90 to-indigo-400/90">
                <span className="text-sm font-semibold text-slate-900">L</span>
              </div>
              <span className="text-sm font-semibold tracking-wide">Lumen Capital</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#plans" className="hover:text-white">Plans</a>
              <a href="#security" className="hover:text-white">Security</a>
              <a href="#faq" className="hover:text-white">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-slate-300 hover:text-white">Login</Link>
              <Button className="rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 text-slate-900 hover:opacity-90">
                Get Started
              </Button>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 text-cyan-100">Ledger Verified</span>
                <span className="rounded-full border border-violet-300/30 bg-violet-400/15 px-3 py-1 text-violet-100">Daily Distribution</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-emerald-100">KYC Secured</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                Digital wealth operations,
                <span className="mt-2 block bg-gradient-to-r from-cyan-100 via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                  rebuilt for scale.
                </span>
              </h1>
              <p className="text-base text-slate-300 sm:text-lg">
                A ledger‑first investment platform with automated rewards, verified compliance, and
                enterprise controls — designed for modern operators.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 text-slate-900">
                  Start Investing
                </Button>
                <Button variant="outline" className="rounded-full border-white/20 text-white">
                  View Live Demo
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Assets under management', value: '$48.2M' },
                  { label: 'Active investors', value: '12,840' },
                  { label: 'Avg. ROI delivered', value: '2.6% daily' }
                ].map((item, idx) => (
                  <div key={item.label} className={`rounded-2xl border border-white/10 p-4 ${colorfulCardSkins[idx % colorfulCardSkins.length]}`}>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-white/14 via-white/10 to-white/5 p-4 shadow-[0_20px_60px_rgba(5,10,25,0.25)] backdrop-blur">
                <LiveStats />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-[#8ec5ff]/10 to-[#7aa2ff]/10 p-6 shadow-[0_20px_60px_rgba(5,10,25,0.25)] ring-1 ring-white/10">
                <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Live allocation</p>
                  <p className="mt-3 text-3xl font-semibold">+16.9% APY</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Automated allocation across verified strategies with daily distribution.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm text-slate-200">
                    <span>Next reward</span>
                    <span>02:14:56</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-indigo-200/10 to-blue-200/10 p-5 shadow-[0_18px_50px_rgba(39,69,163,0.14)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200">Yield Pulse</p>
                  <p className="mt-3 text-2xl font-semibold">+2.8%</p>
                  <p className="mt-1 text-xs text-slate-200">Today trend</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-emerald-200/10 to-cyan-200/10 p-5 shadow-[0_18px_50px_rgba(10,40,34,0.18)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Ops Health</p>
                  <p className="mt-3 text-2xl font-semibold">99.99%</p>
                  <p className="mt-1 text-xs text-slate-200">Queue uptime</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-indigo-200/10 to-violet-200/8 p-6 shadow-[0_20px_60px_rgba(10,14,28,0.28)]">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Security posture</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">2FA enforced</div>
                  <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Ledger audits</div>
                  <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Risk scoring</div>
                  <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Withdrawal holds</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { k: '24h Deposits', v: '$2.9M' },
              { k: '24h Withdrawals', v: '$1.2M' },
              { k: 'Payout Accuracy', v: '99.98%' },
              { k: 'System Uptime', v: '99.99%' }
            ].map((s, i) => (
              <div key={s.k} className={`rounded-2xl border border-white/10 p-4 shadow-[0_18px_44px_rgba(6,10,24,0.35)] backdrop-blur-sm ${colorfulCardSkins[i % colorfulCardSkins.length]}`}>
                <p className="text-xs text-slate-300">{s.k}</p>
                <p className="mt-2 text-xl font-semibold">{s.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-2xl font-semibold text-transparent">
                Why operators choose Lumen
              </h2>
              <p className="mt-2 text-sm text-slate-300">Enterprise controls without enterprise drag.</p>
            </div>
            <Button variant="outline" className="rounded-full border-white/20 text-white">View platform tour</Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {features.map((item, idx) => (
              <div key={item.title} className={`rounded-2xl border border-white/10 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 ${colorfulCardSkins[idx % colorfulCardSkins.length]}`}>
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="plans" className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold">Investment plans</h2>
              <p className="mt-2 text-sm text-slate-300">Pick a plan tailored to your investment band.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> All plans live
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {plans.map((plan, idx) => (
              <div key={plan.name} className={`group rounded-2xl border border-white/10 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-white/20 ${colorfulCardSkins[idx % colorfulCardSkins.length]}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-cyan-200">{plan.name}</p>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs">{plan.term}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Investment</span>
                    <span>{plan.range}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily ROI</span>
                    <span>{plan.roi}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  {plan.perks.map(perk => (
                    <span key={perk} className="rounded-full border border-white/10 px-3 py-1">{perk}</span>
                  ))}
                </div>
              <Button className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 text-slate-900 shadow-[0_10px_30px_rgba(59,130,246,0.25)]">
                Select Plan
              </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-cyan-200/10 to-indigo-200/8 p-6 backdrop-blur">
              <h2 className="text-2xl font-semibold">Profit calculator</h2>
              <p className="mt-2 text-sm text-slate-300">Estimate returns for any plan in seconds.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Input placeholder="Investment amount" />
                <Input placeholder="Plan duration" />
                <Input placeholder="Estimated ROI" />
              </div>
              <Button className="mt-4 rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 text-slate-900">
                Calculate
              </Button>
            </div>
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-violet-200/10 to-blue-200/8 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Capital flywheel</p>
              <h3 className="mt-3 text-xl font-semibold">Daily rewards, transparent ledger</h3>
              <p className="mt-2 text-sm text-slate-300">
                Every credit and debit is logged — investors can track performance in real time.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Ledger entries today</span>
                  <span>3,421</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payout accuracy</span>
                  <span>99.98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg. approval time</span>
                  <span>18 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold">Start in minutes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.title} className={`rounded-2xl border border-white/10 p-4 ${colorfulCardSkins[idx % colorfulCardSkins.length]}`}>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-2 text-sm text-slate-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-emerald-200/10 to-cyan-200/8 p-6 backdrop-blur">
              <h2 className="text-2xl font-semibold">Security</h2>
              <p className="mt-2 text-sm text-slate-300">
                2FA, rate limiting, and audited ledgers keep assets protected.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-200">
                <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Device fingerprinting</div>
                <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Secure cookies</div>
                <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Risk scoring</div>
                <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-4">Audit log trails</div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-indigo-200/10 to-violet-200/8 p-6 backdrop-blur">
              <h2 className="text-2xl font-semibold">Compliance</h2>
              <p className="mt-2 text-sm text-slate-300">
                KYC verification, risk scoring, and admin approvals built in.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                {['KYC review queue', 'Withdrawal holds', 'AML screening', 'Staff permissions'].map(item => (
                  <span key={item} className="rounded-full border border-white/10 px-3 py-1">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-2xl font-semibold text-transparent">
            Trusted by operators
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, idx) => (
              <div key={item.name} className={`rounded-2xl border border-white/10 p-6 ${colorfulCardSkins[idx % colorfulCardSkins.length]}`}>
                <p className="text-sm text-slate-300">“{item.quote}”</p>
                <p className="mt-4 text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-slate-400">{item.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold">FAQs</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((item, idx) => (
              <div key={item.q} className={`rounded-2xl border border-white/10 p-4 ${colorfulCardSkins[idx % colorfulCardSkins.length]}`}>
                <p className="text-sm font-semibold">{item.q}</p>
                <p className="mt-2 text-sm text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-indigo-200/10 to-blue-200/8 p-6 shadow-[0_24px_80px_rgba(13,18,40,0.35)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Newsletter</h2>
                <p className="mt-2 text-sm text-slate-300">Get product updates and launch tips.</p>
              </div>
              <form className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                <Input type="email" placeholder="Email address" className="min-w-[260px]" />
                <Button className="rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 text-slate-900">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur">
          <div className="mx-auto flex flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-400">© 2026 Lumen Capital. All rights reserved.</p>
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
              <Link href="/login">Login</Link>
              <Link href="/register">Get Started</Link>
              <a href="#features">Features</a>
              <a href="#plans">Plans</a>
              <a href="#security">Security</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </footer>
      </main>
    </ThemeShell>
  );
}
