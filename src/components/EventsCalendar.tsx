import dayjs, { Dayjs } from "dayjs";
import React, { useState, useEffect } from "react";
import { generateDate, months } from "../util/calendar";
import cn from "../util/cn";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { Event } from "@/interfaces/interfaces";
import Link from "next/link";
import { parseLocalDayjs } from "@/util/dateHelper";

interface CalendarProps {
  currentDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  events: Event[];
}

export default function Calendar({ currentDate, onDateSelect, events }: CalendarProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const [today, setToday] = useState<Dayjs>(currentDate);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [showEventsList, setShowEventsList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

  useEffect(() => {
    setToday(currentDate);
  }, [currentDate]);

  useEffect(() => {
    const filtered = events.filter(event =>
      [event.genre, event.title, event.location].some(field =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredEvents(filtered);
  }, [searchTerm, events]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = event.target.value as 'day' | 'week' | 'month';
    setViewMode(newMode);
    const newDate = {
      day: dayjs(),
      week: dayjs().startOf('week'),
      month: dayjs().startOf('month')
    }[newMode];
    setToday(newDate);
    onDateSelect(newDate);
  };

  const handleNext = () => {
    const newDate = today.add(1, viewMode);
    setToday(newDate);
    onDateSelect(newDate);
  };

  const handlePrevious = () => {
    const newDate = today.subtract(1, viewMode);
    setToday(newDate);
    onDateSelect(newDate);
  };

  return (
    <div className="flex flex-col gap-10 justify-center mx-auto py-6 px-4 sm:px-6 lg:px-8 text-white">
      {/* Header & Navigation */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {months[today.month()]} {today.year()}
          </h1>
          <div className="flex items-center gap-3">
            <GrFormPrevious
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={handlePrevious}
              aria-label="Previous"
            />
            <select
              value={viewMode}
              onChange={handleViewModeChange}
              className="p-2 text-black rounded border"
              aria-label="View Mode Selector"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
            <GrFormNext
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={handleNext}
              aria-label="Next"
            />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 text-center mb-2 text-sm font-medium text-gray-400">
          {days.map((day, i) => <div key={i}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {generateDate(today.month(), today.year()).map(({ date, currentMonth }, index) => (
            <div key={index} className="p-2 text-center">
              <button
                onClick={() => onDateSelect(date)}
                className={cn(
                  'rounded-full w-10 h-10 flex items-center justify-center transition select-none',
                  currentMonth ? 'text-white' : 'text-gray-400',
                  today.isSame(date, 'day') && 'bg-blue-600 text-white',
                  currentDate.isSame(date, 'day') && 'ring ring-blue-400 bg-blue-100 text-black hover:text-black hover:bg-blue-100'
                )}
              >
                {date.date()}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Event Search & List */}
      <div className="w-full max-w-4xl mx-auto mt-6">
        <button
          onClick={() => setShowEventsList(!showEventsList)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
        >
          {showEventsList ? "Close Search" : "Search All Events"}
        </button>

        {showEventsList && (
          <div className="mt-6 bg-gray-800 p-4 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-4">🔎 Search Events</h2>
            <input
              type="text"
              placeholder="Search by title, genre, or location"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full mb-6 p-3 rounded-md border border-gray-300 text-black"
            />

            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <Link key={event.id} href={`/eventRouter/${event.id}`}>
                    <div className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                      <h3 className="text-lg font-bold">{event.title}</h3>
                      <p className="text-sm text-gray-300">
                        Genre: {event.genre} — {parseLocalDayjs(event.date).format("MM/DD/YYYY")} — {event.location}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-300 text-center">No events found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
