import dayjs, { Dayjs } from "dayjs";
import React, { useState, useEffect } from "react";
import { generateDate, months } from "../util/calendar";
import cn from "../util/cn";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { Event } from "@/interfaces/interfaces";
import Link from "next/link";

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
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = events.filter(event =>
      event.genre.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredEvents(filtered);
  }, [searchTerm, events]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setViewMode(event.target.value as 'day' | 'week' | 'month');
    let newDate = today;
    if (event.target.value === 'day') {
      newDate = dayjs();
    } else if (event.target.value === 'week') {
      newDate = dayjs().startOf('week');
    } else if (event.target.value === 'month') {
      newDate = dayjs().startOf('month');
    }
    setToday(newDate);
    onDateSelect(newDate);
  };

  const handleNext = () => {
    let newDate;
    if (viewMode === 'day') {
      newDate = today.add(1, 'day');
    } else if (viewMode === 'week') {
      newDate = today.add(1, 'week');
    } else {
      newDate = today.add(1, 'month');
    }
    setToday(newDate);
    onDateSelect(newDate);
  };

  const handlePrevious = () => {
    let newDate;
    if (viewMode === 'day') {
      newDate = today.subtract(1, 'day');
    } else if (viewMode === 'week') {
      newDate = today.subtract(1, 'week');
    } else {
      newDate = today.subtract(1, 'month');
    }
    setToday(newDate);
    onDateSelect(newDate);
  };

  return (
    <div className="flex flex-col gap-10 justify-center mx-auto py-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="select-none font-semibold p-5 text-xl">
            {months[today.month()]}, {today.year()}
          </h1>
          <div className="flex gap-4 items-center">
            <GrFormPrevious
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={handlePrevious}
            />
            <select
              value={viewMode}
              onChange={handleViewModeChange}
              className="p-2 border rounded text-black"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <GrFormNext
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, index) => (
            <div key={index} className="text-gray-500 select-none">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {generateDate(today.month(), today.year()).map(({ date, currentMonth }, index) => (
            <div key={index} className="p-2 text-center text-sm">
              <h1
                className={cn(
                  currentMonth ? 'text-white' : 'text-gray-400',
                  today.isSame(date, 'day') ? 'bg-blue-600 text-white' : '',
                  currentDate.isSame(date, 'day') ? 'bg-blue-100 text-black' : '',
                  'rounded-full hover:bg-blue-100 hover:text-black transition cursor-pointer select-none'
                )}
                onClick={() => onDateSelect(date)}
              >
                {date.date()}
              </h1>
            </div>
          ))}
        </div>
      </div>
      {showEventsList && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-white mb-2">Search All Upcoming Events</h2>
          <input
            type="text"
            placeholder="Search by music genre"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border-b text-black mb-4"
          />
          <div className="mt-4 max-h-96 overflow-y-auto">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <Link key={event.id} href={`/eventRouter/${event.id}`} passHref>
                  <div className="block mb-4 p-2 text-white rounded hover:bg-gray-100 hover:text-black transition">
                    <div className="font-bold text-lg">{event.title}</div>
                    <div className="text-sm text-gray-400">Genre: {event.genre}</div>
                    <div className="text-sm text-gray-400">
                      Date: {dayjs(event.date).format('MM/DD/YYYY')} | Location: {event.location}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4">No events found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
