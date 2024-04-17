import dayjs from "dayjs";
import React, { useState } from "react";
import { generateDate, months } from "../util/calendar";
import cn from "../util/cn";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";

export default function Calendar() {
	const days = ["S", "M", "T", "W", "T", "F", "S"];
	const currentDate = dayjs();
	const [today, setToday] = useState(currentDate);
	const [selectDate, setSelectDate] = useState(currentDate);
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
              onClick={() => setToday(today.subtract(1, 'month'))}
            />
            <h1
              className="cursor-pointer hover:scale-110 transition"
              onClick={() => setToday(currentDate)}
            >
              Today
            </h1>
            <GrFormNext
              className="w-6 h-6 cursor-pointer hover:scale-110 transition"
              onClick={() => setToday(today.add(1, 'month'))}
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
          {generateDate(today.month(), today.year()).map(({ date, currentMonth, today }, index) => (
            <div key={index} className="p-2 text-center text-sm">
              <h1
                className={cn(
                  currentMonth ? 'text-white' : 'text-gray-400',
                  today ? 'bg-blue-600 text-white' : '',
                  selectDate.isSame(date, 'date') ? 'bg-blue-100 text-black' : '',
                  'rounded-full hover:bg-blue-100 hover:text-black transition cursor-pointer select-none'
                )}
                onClick={() => setSelectDate(date)}
              >
                {date.date()}
              </h1>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-white shadow rounded">
          <h1 className="font-semibold text-black">
            Schedule for {selectDate.format('dddd, MMMM D, YYYY')}
          </h1>
          <p className="text-gray-400">No meetings for today.</p>
        </div>
      </div>
    </div>
  );
}