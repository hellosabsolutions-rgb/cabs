'use client';

const sidebarItems = [
  { label: 'Dashboard', active: true },
  { label: 'Vehicles' },
  { label: 'Drivers' },
  { label: 'Trips' },
  { label: 'Fuel' },
  { label: 'Compliance' },
  { label: 'Alerts' },
  { label: 'Reports' },
];

const stats = [
  { label: 'Revenue', value: '₹8.4L', change: '+12.3%', color: '#1687F5', w: 75 },
  { label: 'Vehicles', value: '47', change: '+3', color: '#26B8D8', w: 60 },
  { label: 'Profit', value: '₹3.9L', change: '+8.1%', color: '#F15B4A', w: 82 },
  { label: 'Compliance', value: '98%', change: '', color: '#1687F5', w: 98 },
];

const chartBars = [40, 52, 38, 62, 55, 72, 60, 78, 68, 85, 80, 92];

const vehicles = [
  { reg: 'DL 1S 1234', type: 'Sedan', driver: 'Rahul Sharma', status: 'Running', statusColor: '#26B8D8', location: 'New Delhi' },
  { reg: 'KA 02 5678', type: 'SUV', driver: 'Suresh Kumar', status: 'Idle', statusColor: '#A5A5A5', location: 'Bangalore' },
  { reg: 'MH 04 9012', type: 'Sedan', driver: 'Vikram Singh', status: 'Running', statusColor: '#26B8D8', location: 'Mumbai' },
  { reg: 'DL 5A 3456', type: 'Van', driver: 'Amit Patel', status: 'Maintenance', statusColor: '#F15B4A', location: 'Gurugram' },
];

export function DashboardMock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface overflow-hidden shadow-xl select-none ${className}`}
      role="img"
      aria-label="KABPRO dashboard preview"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-elevated/80">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff7557]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f8bc3b]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#80e1d9]" />
        </div>
        <div className="flex-1 mx-6">
          <div className="h-4 rounded-md bg-surface-bright max-w-[180px] mx-auto flex items-center justify-center">
            <span className="text-[7px] text-faint font-medium">kabpro.in/dashboard</span>
          </div>
        </div>
        <div className="w-5 h-5 rounded-full bg-[#7856ff] flex items-center justify-center">
          <span className="text-[6px] text-white font-bold">RS</span>
        </div>
      </div>

      <div className="flex min-h-[240px] sm:min-h-[320px]">
        {/* Sidebar */}
        <div className="w-[120px] border-r border-border bg-surface p-2.5 hidden sm:block shrink-0">
          <div className="flex items-center gap-1.5 px-2 mb-4">
            <div className="w-4 h-4 rounded bg-foreground flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14.5 5v6L8 15 1.5 11V5L8 1z" fill="white" />
              </svg>
            </div>
            <span className="text-[8px] font-bold text-foreground tracking-tight">KABPRO</span>
          </div>

          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[8px] mb-0.5 transition-colors ${
                item.active
                  ? 'bg-accent text-accent-text font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-sm ${
                  item.active ? 'bg-white/30' : 'bg-border'
                }`}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 overflow-hidden">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-surface-elevated/70 border border-border/50 p-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[7px] text-muted">{s.label}</p>
                  {s.change && (
                    <span className="text-[6px] font-medium" style={{ color: s.color }}>
                      {s.change}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-foreground tracking-tight">
                  {s.value}
                </p>
                <div className="h-0.5 w-full bg-border/50 rounded-full mt-1.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.w}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-lg bg-surface-elevated/70 border border-border/50 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8px] font-semibold text-foreground">Revenue Trend</p>
              <div className="flex gap-2">
                {['1W', '1M', '3M'].map((p, i) => (
                  <span
                    key={p}
                    className={`text-[6px] px-1.5 py-0.5 rounded ${
                      i === 1
                        ? 'bg-accent text-accent-text font-semibold'
                        : 'text-muted'
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-[3px] h-[52px]">
              {chartBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${h}%`,
                    background:
                      i === chartBars.length - 1
                        ? '#1687F5'
                        : `linear-gradient(to top, #1270D6, #1687F5)`,
                    opacity: i === chartBars.length - 1 ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                (m) => (
                  <span key={m} className="text-[5px] text-faint">
                    {m}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Vehicle table */}
          <div className="rounded-lg bg-surface-elevated/70 border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <p className="text-[8px] font-semibold text-foreground">
                Vehicle List
              </p>
              <span className="text-[6px] text-muted">
                Showing 4 of 47
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 px-3 py-1.5 text-[6px] text-faint uppercase tracking-wider border-b border-border/30">
              <span>Reg No.</span>
              <span className="hidden sm:block">Type</span>
              <span>Driver</span>
              <span>Status</span>
              <span className="hidden sm:block">Location</span>
            </div>
            {vehicles.map((v) => (
              <div
                key={v.reg}
                className="grid grid-cols-3 sm:grid-cols-5 gap-1 px-3 py-1.5 text-[7px] border-b border-border/20 last:border-0"
              >
                <span className="font-mono text-foreground font-medium">
                  {v.reg}
                </span>
                <span className="text-muted hidden sm:block">{v.type}</span>
                <span className="text-foreground">{v.driver}</span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: v.statusColor }}
                  />
                  <span style={{ color: v.statusColor }}>{v.status}</span>
                </span>
                <span className="text-muted hidden sm:block">{v.location}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
