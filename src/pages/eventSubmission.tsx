import "../styles/globals.css";
import React, { useState } from "react";
import { submitEvent, logoutUser } from "./api/route";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";

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
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const { user, logout } = useAuth();
  const router = useRouter()
  
  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setEventData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogout = async () => {
    try {  
      await logoutUser()
      logout()
      router.push('/')
    } catch (err) {
      console.error(err)
    }
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    // if the data isn't right there should be a visible warning, there is not one currently
    console.log("user here: ", user)
     if (!user) {
    // Maybe set an error message state here
    console.error('No user logged in');
    return 
  }
    const formData = {
      user_id: user.id,
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      date: eventData.date,
      genre: eventData.genre,
      ticket_price: eventData.ticketPrice,
      age_restriction: eventData.ageRestriction,
      website_link: eventData.eventLink,
    }
    console.log(formData)
    try {
    const res = await submitEvent(formData)
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to submit event');
    } else{
      setSubmissionSuccess(true)
  
      setTimeout(() => {
        router.push('/')
        setSubmissionSuccess(false);
       }, 3000);

    }

    console.log('Event submitted successfully');
   } catch (error) {
    console.error("There was an error submitting event:", error);  
  }
};

  if(submissionSuccess) {
    return(
     <div className="container mx-auto p-4">
       <h1 className="text-center text-2xl font-bold mb-6">Submission successful! Redirecting to homepage...</h1>
      </div>
    )
  }

  if(user){
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
         <div className="flex flex-col items-center space-y-4 ">
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Submit
            </button>
            <Link href='/' className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Go Back to Homepage</Link>
            <button  onClick={handleLogout} className="mt-4 text-blue-500">
              Logout
            </button>          
          </div>
       </form>
     </div>
    )
  } else{
    return(
      <>
        <h1>Please Sign In or Go Back!</h1>
        <Link href='/' className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Go Back</Link>
      </>
    )
  }
};
export default EventSubmission;
