import dayjs, { Dayjs } from "dayjs";
import React, { useState, useEffect } from "react";
import { generateDate, months } from "../util/calendar";
import cn from "../util/cn";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { Event } from "@/interfaces/interfaces";
import { parseLocalDayjs } from "@/util/dateHelper";

interface CalendarProps {
  currentDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  events: Event[];
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
    const now = dayjs();
    setViewDate(now);
    onDateSelect(now);
  };

  const getEventsForDate = (date: Dayjs) =>
    events.filter((event) => parseLocalDayjs(event.date).isSame(date, "day"));

  return (
    <div className="text-white">
      {/* Header & Navigation */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-semibold">
          {months[viewDate.month()]} {viewDate.year()}
        </h1>
        <div className="flex items-center gap-3 text-slate-200">
          <GrFormPrevious
            className="w-6 h-6 cursor-pointer hover:scale-110 transition"
            onClick={handlePrevious}
            aria-label="Previous"
          />
          <button
            onClick={handleToday}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:border-emerald-400 hover:text-white transition"
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
      <div className="grid grid-cols-7 gap-2 text-center mb-2 text-sm font-medium text-gray-400">
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
          const isToday = dayjs().isSame(date, "day");

          return (
            <div key={index} className="p-2 text-center">
              <button
                onClick={() => onDateSelect(date)}
                className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center transition select-none border border-transparent",
                  currentMonth ? "text-slate-200" : "text-slate-600",
                  isToday && "border border-emerald-400/60",
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow shadow-emerald-500/30"
                    : "hover:border-emerald-400/60",
                  hasEvents && !isSelected && "border border-purple-400/40"
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

      <div className="mt-3 text-xs text-slate-400">
        Showing events for{" "}
        <span className="font-semibold text-slate-100">
          {currentDate.format("dddd, MMM D, YYYY")}
        </span>
      </div>

      <div className="mt-4 text-sm text-gray-300 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border border-emerald-400"></span>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-purple-400/70"></span>
          <span>Has events</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
