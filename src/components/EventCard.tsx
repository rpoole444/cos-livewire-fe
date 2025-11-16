import Link from "next/link";

type EventCardProps = {
  id?: number | string;
  title: string;
  slug?: string | null;
  startTime: string;
  city?: string | null;
  venueName?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
};

const EventCard: React.FC<EventCardProps> = ({
  title,
  slug,
  startTime,
  city,
  venueName,
  imageUrl,
  isFeatured,
}) => {
  const date = new Date(startTime);
  const dow = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.toLocaleDateString(undefined, { day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const Wrapper: any = slug ? Link : "div";
  const wrapperProps = slug ? { href: `/eventRouter/${slug}` } : {};

  return (
    <Wrapper {...wrapperProps} className={slug ? "group block" : undefined}>
      <article className="flex gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm transition hover:border-emerald-400/80 hover:bg-slate-900 hover:shadow-emerald-500/25">
        {imageUrl && (
          <div className="hidden h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-800 sm:block">
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
              <span>{dow}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>
                {month} {day}
              </span>
            </span>
            <span className="text-slate-500">· {time}</span>
            {isFeatured && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                Featured
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-50 group-hover:text-white">{title}</h3>
          {(venueName || city) && (
            <p className="mt-1 text-xs text-slate-400">
              {venueName && <span>{venueName}</span>}
              {venueName && city && <span className="mx-1">•</span>}
              {city && <span>{city}</span>}
            </p>
          )}
        </div>
      </article>
    </Wrapper>
  );
};

export default EventCard;
