import Link from "next/link";
import { CheckCircle2, Circle, Info } from "lucide-react";
import { Event } from "@/interfaces/interfaces";

type EventQualityChecklistProps = {
  event: Event;
  canEdit?: boolean;
};

const hasValue = (value?: string | number | null) => {
  if (value == null) return false;
  return String(value).trim().length > 0;
};

const buildChecks = (event: Event) => [
  {
    label: "Poster or event image",
    complete: hasValue(event.poster),
    hint: "Add a show poster or artist photo so the listing stands out.",
  },
  {
    label: "Ticket / RSVP link",
    complete: hasValue(event.website_link) && event.website_link !== "http://",
    hint: "Add the best ticket, RSVP, or event info link.",
  },
  {
    label: "Region",
    complete: hasValue(event.region),
    hint: "Set the region so fans can filter by area.",
  },
  {
    label: "Venue",
    complete: hasValue(event.venue_name) || hasValue(event.location),
    hint: "Add a venue name or clear location.",
  },
  {
    label: "Description",
    complete: hasValue(event.description) && String(event.description || "").trim().length >= 40,
    hint: "Add a useful description with lineup, vibe, and show details.",
  },
  {
    label: "Artist/profile link",
    complete: hasValue(event.artist_profile_id) || hasValue(event.venue_profile_id),
    hint: "Connect this event to an artist or venue profile when possible.",
  },
];

const EventQualityChecklist = ({ event, canEdit = false }: EventQualityChecklistProps) => {
  const checks = buildChecks(event);
  const completed = checks.filter((check) => check.complete).length;
  const score = Math.round((completed / checks.length) * 100);
  const incomplete = checks.filter((check) => !check.complete);

  return (
    <section className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Listing quality</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">{score}% complete</h2>
          <p className="mt-2 text-sm text-slate-400">
            A stronger listing helps fans trust the details and gives artists, venues, and promoters fewer reasons to create duplicates.
          </p>
        </div>
        {canEdit && (
          <Link
            href={`/events/edit/${event.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Improve listing
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`rounded-2xl border p-4 ${
              check.complete
                ? "border-emerald-400/30 bg-emerald-400/10"
                : "border-amber-400/30 bg-amber-400/10"
            }`}
          >
            <div className="flex items-start gap-3">
              {check.complete ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-100">{check.label}</p>
                {!check.complete && <p className="mt-1 text-xs text-slate-400">{check.hint}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {incomplete.length > 0 && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <p>
            Best next fix: <span className="font-semibold text-slate-100">{incomplete[0].label}</span>. {incomplete[0].hint}
          </p>
        </div>
      )}
    </section>
  );
};

export default EventQualityChecklist;
