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

   return (
    <div className="flex flex-col gap-10 justify-center mx-auto py-4">
      <div className="w-full max-w-4xl mx-auto"> {/* Adjust width as needed */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="select-none font-semibold p-5 text-xl">
            {months[today.month()]}, {today.year()}
          </h1>
          <div className="flex gap-4 items-center">
            <GrFormPrevious
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={() => onDateSelect(today.subtract(1, 'day'))}
            />
            <h1
              className="cursor-pointer hover:scale-110 transition"
              onClick={() => setToday(currentDate)}
            >
              Today
            </h1>
            <GrFormNext
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={() => onDateSelect(today.add(1, 'day'))}
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