import { EventTrustLabel, EventTrustTone } from "@/util/eventTrust";

type EventTrustLabelsProps = {
  labels: EventTrustLabel[];
  compact?: boolean;
};

const toneClasses: Record<EventTrustTone, string> = {
  emerald: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100",
  gold: "border-gold/60 bg-gold/15 text-sun-gold",
  copper: "border-copper/60 bg-copper/15 text-mist",
  blue: "border-sky-400/60 bg-sky-500/15 text-sky-100",
  slate: "border-slate-500/60 bg-slate-700/30 text-slate-100",
};

const EventTrustLabels = ({ labels, compact = false }: EventTrustLabelsProps) => {
  if (!labels.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label) => (
        <span
          key={label.key}
          className={`${toneClasses[label.tone]} border px-2.5 py-1 font-bold uppercase tracking-[0.14em] ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
        >
          {label.label}
        </span>
      ))}
    </div>
  );
};

export default EventTrustLabels;

