import "../styles/globals.css";
import React, { useState } from "react";
import { submitEvent, logoutUser } from "./api/route";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
// import cheyenneMountain from "../../public/cheyenne mountain.jpeg"

interface Event {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  eventType: string;
  genre: string;
  ticketPrice: string;
  ageRestriction: string;
  eventLink: string;
}

const EventSubmission = () => {
  const [eventData, setEventData] = useState<Event>({
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
      // await logoutUser()
        logout()
        router.push('/')
    } catch (err) {
      console.error(err)
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // Check if the user is logged in
  if (!user) {
    console.error('No user logged in');
    // Here you would typically update a piece of state to show an error message to the user
    return;
  }

  let ticketPriceValue = eventData.ticketPrice;
  if (ticketPriceValue === 'Free' || ticketPriceValue === 'Donation') {
    ticketPriceValue = '0';
  } 
  ticketPriceValue = ticketPriceValue.replace(/\D/g, '');
if (ticketPriceValue === '') {
  ticketPriceValue = '0';
}
// Finally, convert ticketPriceValue to a number

ticketPriceValue = Number(ticketPriceValue);
  const formData = {
    user_id: user.id,
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    date: eventData.date,
    genre: eventData.genre,
    ticket_price: ticketPriceValue,
    age_restriction: eventData.ageRestriction,
    website_link: eventData.eventLink.startsWith('http') ? eventData.eventLink : `http://${eventData.eventLink}`,
  };

  try {
    const res = await submitEvent(formData);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to submit event');
    }
    
    // Successful submission logic
    setSubmissionSuccess(true);
    setTimeout(() => {
      router.push('/');
      setSubmissionSuccess(false);
    }, 3000);

  } catch (error) {
    console.error("There was an error submitting the event:", error);
    // Update your component's state here to reflect the error
  }
};


  if(submissionSuccess) {
    return(
     <div className="container mx-auto p-4">
       <h1 className="text-center text-2xl font-bold mb-6">
        Submission successful! Redirecting to homepage...
        </h1>
      </div>
    )
  }
console.log("submission userstate: ", user)
  if(user){
    return (
     <div className="container mx-auto p-4">
      <div 
        className="text-center mb-8"
        style={{
          // backgroundImage: `url(${cheyenneMountain})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        >
        <h1 className="text-2xl font-bold">{user.first_name}, Let's get your event out there!!</h1>
        <p className="text-md mt-2">
          Fill out our Submission Form!
        </p>
      </div>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <p className="text-gray-700 text-base mb-4">
        Please fill out the form below with your event details.
        Make sure to include all required fields so we can add your event to our online calendar and help you promote your event!!
      </p>
      <p className="text-gray-600 text-sm mb-4">
        Please use appropriate language for your event and be mindful of your spelling and grammar.
        We will review and scan for both grammatical errors as well as appropriate language before approval and posting to the public-facing calendar.
      </p>
       <form onSubmit={handleSubmit} className="mt-4 w-full max-w-lg mx-auto">
         <div className="mb-4">
           <label htmlFor="title" className="block text-md font-medium text-black">Event Title</label>
           <input type="text" id="title" name="title" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
         </div>
         <div className="mb-4">
           <label htmlFor="description" className="block text-md font-medium text-black">Event Description</label>
           <textarea id="description" name="description" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"></textarea>
         </div>
         <div className="mb-4">
           <label htmlFor="location" className="block text-md font-medium text-black">Event Location</label>
           <input type="text" id="location" name="location" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
         </div>
         <div className="mb-4">
           <label htmlFor="date" className="block text-md font-medium text-black">Event Date</label>
           <input type="date" id="date" name="date" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
         </div>
         {/* <div className="mb-4">
           <label htmlFor="time" className="block text-md font-medium text-black">Event Time</label>
           <input type="time" id="time" name="time" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
         </div>
         <div className="mb-4">
           <label htmlFor="eventType" className="block text-md font-medium text-black">Event Type</label>
           <input type="text" id="eventType" name="eventType" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"/>
         </div> */}
         <div className="mb-4">
           <label htmlFor="genre" className="block text-md font-medium text-black">Event Genre</label>
          <select id="genre" name="genre" required onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black">
            <option value="">Select Genre</option>
            <option value="Jazz">Jazz</option>
            <option value="Indie">Indie</option>
            <option value="Rock">Rock</option>
            <option value="Alternative">Alternative</option>
            <option value="Country">Country</option>
            <option value="Hip-Hop">Hip-Hop</option>
            <option value="Pop">Pop</option>
            <option value="R&B">R&B</option>
            <option value="Rap">Rap</option>
            <option value="Reggae">Reggae</option>
            <option value="Soul">Soul</option>
            <option value="Techno">Techno</option>
            <option value="World">World</option>
            <option value="Other">Other</option>
          </select>
         </div>
         <div className="mb-4">
           <label htmlFor="ticketPrice" className="block text-md font-medium text-black">Ticket Price / Door Charge</label>
          <select id="ticketPrice" name="ticketPrice" onChange={handleChange} className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black">
            <option value="Free">Free</option>
            <option value="Donation">Donation</option>
            {Array.from(Array(20).keys()).map(i => (
              <option key={i} value={(i+1)*5}>${(i+1)*5}</option>
            ))}
          </select>
          </div>
          <div className="mb-4">
            <div className="flex space-x-4 items-center">
              {["All Ages", "16+", "18+", "21+", "25+"].map(age => (
                <label key={age} className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    name="ageRestriction" 
                    value={age} 
                    onChange={handleChange} 
                    className="w-6 h-6" // Adjust the size as needed
                  />
                  <span className="text-lg text-black">{age}</span> {/* Adjust font-size using text-base, text-lg etc. */}
                </label>
              ))}
            </div>
          </div>
         <div className="mb-4">
           <label htmlFor="eventLink" className="block text-md font-medium text-black">Website / Event Link</label>
           <input 
          //  type="url" 
           id="eventLink"
           name="eventLink" 
           onChange={handleChange} 
           className="mt-1 p-2 w-full border-2 border-gray-300 rounded-md text-black"
           />
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
