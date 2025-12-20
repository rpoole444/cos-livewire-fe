import Link from "next/link";
import dayjs from "dayjs";
import React from "react";
import EventPoster from "./EventPoster";
import { getEventImageSrc } from "@/util/getEventImageSrc";

type EventCardProps = {
  id: number;
  title: string;
  slug?: string | null;
  startTime?: string | null;
  city?: string | null;
  venueName?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
};

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  slug,
  startTime,
  city,
  venueName,
  imageUrl,
  isFeatured,
}) => {
  const parsed = startTime ? dayjs(startTime) : null;
  const isValidDate = parsed?.isValid() ?? false;

  if (startTime && !isValidDate) {
    console.warn("[EventCard] invalid or missing startTime", { title, startTime });
  }

  const formattedDate = isValidDate ? parsed!.format("ddd, MMM D • h:mm A") : "Date TBA";
  const imageSrc = getEventImageSrc(imageUrl);

  const card = (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg transition hover:border-emerald-400/80 hover:shadow-emerald-500/25"
    >
      <div className="relative h-72 w-full">
        <EventPoster posterUrl={imageSrc} title={title} variant="card" className="h-full w-full" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-transparent">
          <div className="pointer-events-auto px-4 pb-4 pt-3 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              <span>{formattedDate}</span>
              {isFeatured && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                  Featured
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-white line-clamp-2">{title}</h2>
            {(venueName || city) && (
              <p className="text-sm text-slate-300 line-clamp-1">
                {venueName}
                {venueName && city ? " • " : ""}
                {city}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );

  if (!slug) {
    console.warn("[EventCard] missing slug; navigation disabled", { id, title });
    return <div className="group block">{card}</div>;
  }

  return (
    <Link href={`/eventRouter/${slug}`} className="group block">
      {card}
    </Link>
  );
};

export default EventCard;
