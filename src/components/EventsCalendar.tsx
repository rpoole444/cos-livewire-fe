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
  const [today, setToday] = useState<Dayjs>(currentDate);

  useEffect(() => {
    setToday(currentDate);
  }, [currentDate]);

  const handleNext = () => {
    const newDate = today.add(1, "month");
    setToday(newDate);
  };

  const handlePrevious = () => {
    const newDate = today.subtract(1, "month");
    setToday(newDate);
  };

  const handleToday = () => {
    const now = dayjs();
    setToday(now);
    onDateSelect(now);
  };

  const getEventsForDate = (date: Dayjs) =>
    events.filter((event) => parseLocalDayjs(event.date).isSame(date, "day"));

  return (
    <div className="text-white">
      {/* Header & Navigation */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {months[today.month()]} {today.year()}
        </h1>
        <div className="flex items-center gap-3">
          <GrFormPrevious
            className="w-6 h-6 cursor-pointer hover:scale-110 transition"
            onClick={handlePrevious}
            aria-label="Previous"
          />
          <button
            onClick={handleToday}
            className="text-sm px-3 py-1 border border-gray-500 rounded hover:bg-blue-500 hover:text-white transition"
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
        {generateDate(today.month(), today.year()).map(({ date, currentMonth }, index) => {
          const eventsForDate = getEventsForDate(date);
          const hasEvents = eventsForDate.length > 0;
          const title = hasEvents
            ? eventsForDate.map((e) => e.title).join(", ")
            : undefined;

          return (
            <div key={index} className="p-2 text-center">
              <button
                onClick={() => onDateSelect(date)}
                className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center transition select-none",
                  currentMonth ? "text-white" : "text-gray-400",
                  today.isSame(date, "day") && "bg-blue-600 text-white",
                  currentDate.isSame(date, "day") &&
                    "ring ring-blue-400 bg-blue-100 text-black hover:text-black hover:bg-blue-100",
                  hasEvents && "border-2 border-yellow-400"
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

      {/* Legend */}
      <div className="mt-4 text-sm text-gray-300 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-yellow-400"></span>
          <span>Has events</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border border-blue-400"></span>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
