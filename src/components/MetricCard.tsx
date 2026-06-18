'use client';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  note: string;
  pill?: { variant: 'good' | 'watch' | 'bad'; text: string };
  className?: string;
}

const pillStyles = {
  good: 'bg-mint-soft text-[#1E7A55]',
  watch: 'bg-sun-soft text-[#A06A00]',
  bad: 'bg-peach-soft text-[#B0492F]',
};

export default function MetricCard({ icon, label, value, note, pill, className = '' }: MetricCardProps) {
  return (
    <div className={`bg-card border border-line rounded-[18px] p-4 shadow-[var(--shadow-sm)]
                    hover:shadow-[var(--shadow)] hover:-translate-y-0.5 transition-all duration-200 ${className}`}>
      <div className="text-xl">{icon}</div>
      <div className="text-muted text-[0.72rem] mt-1.5 font-bold uppercase tracking-wide">{label}</div>
      <div className="font-heading font-bold text-2xl mt-0.5">{value}</div>
      <div className="text-xs text-muted mt-0.5">{note}</div>
      {pill && (
        <span className={`inline-block text-[0.72rem] font-extrabold px-2.5 py-0.5 rounded-full mt-2 ${pillStyles[pill.variant]}`}>
          {pill.text}
        </span>
      )}
    </div>
  );
}
