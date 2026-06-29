import Link from "next/link";
import dayjs from "dayjs";
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import EventPoster from "./EventPoster";
import { getEventImageSrc } from "@/util/getEventImageSrc";
import { getRegionLabel } from "@/constants/regions";
import { getEventTrustLabels } from "@/util/eventTrust";
import EventTrustLabels from "./EventTrustLabels";

type EventCardProps = {
  id: number;
  title: string;
  slug?: string | null;
  startTime?: string | null;
  city?: string | null;
  region?: string | null;
  venueName?: string | null;
  imageUrl?: string | null;
  source?: string | null;
  sourceLabel?: string | null;
  claimedArtist?: { id: number; display_name: string; slug: string; user_id: number } | null;
  artistProfileId?: number | null;
  venueProfileId?: number | null;
  venueProfileUserId?: number | null;
  submitterUserId?: number | null;
  claimedByUserId?: number | null;
  lastEditedByUserId?: number | null;
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
  region,
  venueName,
  imageUrl,
  source,
  sourceLabel,
  claimedArtist,
  artistProfileId,
  venueProfileId,
  venueProfileUserId,
  submitterUserId,
  claimedByUserId,
  lastEditedByUserId,
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
  const shouldContainPoster = Boolean(source || sourceLabel);
  const trustLabels = getEventTrustLabels({
    source,
    source_label: sourceLabel,
    claimed_artist: claimedArtist as any,
    artist_profile_id: artistProfileId || undefined,
    venue_profile_id: venueProfileId || undefined,
    venue_profile_user_id: venueProfileUserId || undefined,
    user_id: submitterUserId || undefined,
    claimed_by_user_id: claimedByUserId || undefined,
    last_edited_by_user_id: lastEditedByUserId || undefined,
  });

  const cardContent = (
    <>
      <div className="relative h-80 w-full sm:h-[21rem]">
        <EventPoster
          posterUrl={imageSrc}
          title={title}
          variant="card"
          fit={shouldContainPoster ? "contain" : "cover"}
          className="h-full w-full"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="pointer-events-auto space-y-2 px-4 pb-5 pt-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-mist">
              <span>{formattedDate}</span>
              {region && (
                <span className="border border-alpine/60 bg-pine/70 px-2.5 py-1 text-[10px] text-mist">
                  {getRegionLabel(region)}
                </span>
              )}
              {isFeatured && (
                <span className="border border-gold/60 bg-gold/15 px-2.5 py-1 text-[10px] text-sun-gold">
                  Featured
                </span>
              )}
            </div>
            <EventTrustLabels labels={trustLabels.slice(0, 2)} compact />
            <h2 className="agg-display text-xl font-semibold leading-tight text-ivory line-clamp-2 sm:text-2xl">{title}</h2>
            {(venueName || city) && (
              <p className="text-sm font-medium text-ivory/70 line-clamp-1 sm:text-base">
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
        className="inline-flex h-9 w-9 items-center justify-center border border-gold/60 bg-black/90 text-ivory shadow-lg shadow-black/30 transition hover:border-sun-gold hover:text-sun-gold"
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
          className="inline-flex h-9 w-9 items-center justify-center border border-copper bg-black/90 text-mist shadow-lg shadow-black/30 transition hover:bg-copper/20"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  ) : null;

  const card = (
    <article
      className="agg-corner-frame relative overflow-hidden border border-gold/35 bg-[#11130e] shadow-lg transition hover:-translate-y-1 hover:border-sun-gold hover:shadow-gold/10"
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
