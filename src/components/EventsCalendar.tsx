import dayjs, { Dayjs } from "dayjs";
import React, { useState, useEffect } from "react";
import { generateDate, months } from "../util/calendar";
import cn from "../util/cn";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { CustomEvent } from "@/interfaces/interfaces";
import { parseLocalDayjs } from "@/util/dateHelper";

interface CalendarProps {
  currentDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  events: CustomEvent[];
}

export default function Calendar({
  currentDate,
  onDateSelect,
  events,
}: CalendarProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const [viewDate, setViewDate] = useState<Dayjs>(currentDate);

  useEffect(() => {
    setViewDate(currentDate);
  }, [currentDate]);

  const handleNext = () => {
    const newDate = viewDate.add(1, "month");
    setViewDate(newDate);
  };

  const handlePrevious = () => {
    const newDate = viewDate.subtract(1, "month");
    setViewDate(newDate);
  };

  const handleToday = () => {
    const now = dayjs().startOf("day");
    setViewDate(now);
    onDateSelect(now);
  };

  const getEventsForDate = (date: Dayjs) => {
    if (!events || events.length === 0) return [];

    return events.filter((event) => {
      const eventDate = parseLocalDayjs(event.date);
      if (!eventDate.isValid()) return false;
      return eventDate.isSame(date, "day");
    });
  };

  return (
    <div className="text-ivory">
      {/* Header & Navigation */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="agg-display text-xl font-semibold text-sun-gold">
          {months[viewDate.month()]} {viewDate.year()}
        </h1>
        <div className="flex items-center gap-3 text-ivory/70">
          <GrFormPrevious
            className="w-6 h-6 cursor-pointer hover:scale-110 transition"
            onClick={handlePrevious}
            aria-label="Previous"
          />
          <button
            onClick={handleToday}
            className="border border-gold/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ivory/70 transition hover:border-sun-gold hover:text-sun-gold"
          >
            Today
          </button>
          <GrFormNext
            className="w-6 h-6 cursor-pointer hover:scale-110 transition"
            onClick={handleNext}
            aria-label="Next"
          />
        </div>
      </div>

      {/* Calendar Days */}
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-sm font-bold text-alpine">
        {days.map((day, i) => (
          <div key={i}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {generateDate(viewDate.month(), viewDate.year()).map(({ date, currentMonth }, index) => {
          const eventsForDate = getEventsForDate(date);
          const hasEvents = eventsForDate.length > 0;
          const title = hasEvents
            ? eventsForDate.map((e) => e.title).join(", ")
            : undefined;
          const isSelected = currentDate.isSame(date, "day");
          const isToday = dayjs().startOf("day").isSame(date, "day");

          return (
            <div key={index} className="p-2 text-center">
              <button
                onClick={() => onDateSelect(date)}
                className={cn(
                  "relative rounded-full w-10 h-10 flex items-center justify-center transition select-none border border-transparent text-sm font-semibold",
                  currentMonth ? "text-ivory" : "text-ivory/20",
                  isSelected
                    ? "bg-gold text-black shadow shadow-gold/30"
                    : "hover:border-gold/60 hover:text-sun-gold",
                  hasEvents &&
                    "ring-2 ring-alpine/80 ring-offset-2 ring-offset-[#11130e]",
                  isToday &&
                    "outline outline-2 outline-sun-gold/70 outline-offset-2"
                )}
                aria-label={
                  hasEvents
                    ? `Events on ${date.format("MMM D")}: ${title}`
                    : `No events on ${date.format("MMM D")}`
                }
                title={title}
              >
                {date.date()}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-ivory/45">
        Showing events for{" "}
        <span className="font-semibold text-ivory">
          {currentDate.format("dddd, MMM D, YYYY")}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-ivory/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border border-sun-gold"></span>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-alpine"></span>
          <span>Has events</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-gold"></span>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
