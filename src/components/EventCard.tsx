import Link from "next/link";
import dayjs from "dayjs";
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
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
  canManage?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
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
  canManage,
  onDelete,
}) => {
  const parsed = startTime ? dayjs(startTime) : null;
  const isValidDate = parsed?.isValid() ?? false;

  if (startTime && !isValidDate) {
    console.warn("[EventCard] invalid or missing startTime", { title, startTime });
  }

  const formattedDate = isValidDate ? parsed!.format("ddd, MMM D • h:mm A") : "Date TBA";
  const imageSrc = getEventImageSrc(imageUrl);

  const cardContent = (
    <>
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
    </>
  );

  const actionControls = canManage ? (
    <div className="absolute right-3 top-3 z-10 flex gap-2">
      <Link
        href={`/events/edit/${id}`}
        aria-label={`Edit ${title}`}
        title="Edit event"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-950/85 text-slate-100 shadow-lg shadow-black/30 transition hover:border-emerald-300 hover:text-emerald-200"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${title}`}
          title="Delete event"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this event?")) {
              onDelete(id);
            }
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/70 bg-slate-950/85 text-rose-100 shadow-lg shadow-black/30 transition hover:border-rose-300 hover:bg-rose-500/15"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  ) : null;

  const card = (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg transition hover:border-emerald-400/80 hover:shadow-emerald-500/25"
    >
      {actionControls}
      {slug ? (
        <Link href={`/eventRouter/${slug}`} className="group block">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </article>
  );

  if (!slug) {
    console.warn("[EventCard] missing slug; navigation disabled", { id, title });
    return <div className="group block">{card}</div>;
  }

  return <div className="group block">{card}</div>;
};

export default EventCard;
