'use client';

export default function Metrics() {
  const metrics = [
    { value: '10+', label: 'Years Experience', detail: 'Web Development & Team Leadership' },
    { value: '200+', label: 'Major Production Platforms', detail: 'ERP, Streaming, Booking, E-Learning' },
    { value: '3x', label: 'Leadership Awards', detail: 'Top Gun, Emerging Leader, Best Team Player' },
    { value: '100K+', label: 'Active Users Served', detail: 'Across Booking, HRTech & E-Learning' },
  ];

  return (
    <section className="py-12 bg-slate-950/60 border-y border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((item, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 text-center border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold gradient-text tracking-tight mb-2">
                {item.value}
              </div>
              <div className="text-sm font-bold text-slate-200 mb-1">{item.label}</div>
              <div className="text-xs text-slate-500">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
