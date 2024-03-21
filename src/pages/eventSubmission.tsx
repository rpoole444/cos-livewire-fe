import "../styles/globals.css";
import React, { useState } from "react";
import { submitEvent } from "./api/route";

const EventSubmission = () => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    eventType: '',
    genre: '',
    ticketPrice: '',
    ageRestriction: '',
    eventLink: '',
  });

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setEventData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    // Here you would handle the form submission to your API endpoint
    const formData = {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      date: eventData.date,
      genre: eventData.genre,
      ticket_price: eventData.ticketPrice,
      age_restriction: eventData.ageRestriction,
      event_link: eventData.eventLink,
    }

    try {
    const res = await submitEvent(formData)

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to submit event');
    }
    console.log('Event submitted successfully');
   } catch (error) {
    console.error("There was an error submitting event:", error);
    
  }
  };

   return (
    <div className="container mx-auto p-4">
      <h1 className="text-center text-2xl font-bold mb-6">Submit Your Event</h1>
      <p className="text-center">Please fill out the form below with your event details.<br />Make sure to include all required fields so we can add your event to our online calendar and help you promote your music!</p>
      <form onSubmit={handleSubmit} className="mt-4 w-full max-w-lg mx-auto">
        <div className="mb-4">
          <label htmlFor="title" className="block text-md font-medium text-white">Event Title</label>
          <input type="text" id="title" name="title" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-md font-medium text-white">Event Description</label>
          <textarea id="description" name="description" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="location" className="block text-md font-medium text-white">Event Location</label>
          <input type="text" id="location" name="location" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="mb-4">
          <label htmlFor="date" className="block text-md font-medium text-white">Event Date</label>
          <input type="date" id="date" name="date" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        {/* <div className="mb-4">
          <label htmlFor="time" className="block text-md font-medium text-white">Event Time</label>
          <input type="time" id="time" name="time" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="mb-4">
          <label htmlFor="eventType" className="block text-md font-medium text-white">Event Type</label>
          <input type="text" id="eventType" name="eventType" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div> */}
        <div className="mb-4">
          <label htmlFor="genre" className="block text-md font-medium text-white">Event Genre</label>
          <input type="text" id="genre" name="genre" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="mb-4">
          <label htmlFor="ticketPrice" className="block text-md font-medium text-white">Ticket Price / Door Charge</label>
          <input type="text" id="ticketPrice" name="ticketPrice" onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="mb-4">
          <label htmlFor="ageRestriction" className="block text-md font-medium text-white">Age Restriction</label>
          <input type="text" id="ageRestriction" name="ageRestriction" onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="mb-4">
          <label htmlFor="eventLink" className="block text-md font-medium text-white">Website / Event Link</label>
          <input type="url" id="eventLink" name="eventLink" onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
        </div>
        <div className="text-center">

        </div>
        <button type="submit" className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Submit
        </button>
      </form>
    </div>
   )
};
export default EventSubmission;
