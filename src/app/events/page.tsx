"use client"
import getData from "./api/route"
import { useState } from "react";

const EventsPage = () => {
  const [events, setEvents] = useState([]);

  const fetchData = async () => {
    const data = await getData();
    setEvents(data);
  };
  // console.log("events: ", fetchData());
  return (
    <h1>Events</h1>
  )
}

export default EventsPage