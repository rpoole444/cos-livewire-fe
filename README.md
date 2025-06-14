# Alpine Groove Guide

Alpine Groove Guide is a comprehensive community event calendar designed for the creative community of Colorado Springs. It offers an intuitive interface for discovering current, future, and past local events. Users can register, log in with authenticated credentials, and submit events for administrative review.

## Table of Contents
  - [Setup](#setup)
  - [Technologies](#technologies)
  - [Project Spec](#project-spec)
  - [Abstract](#abstract)
  - [Features](#features)
  - [Learning Goals](#learning-goals)
  - [Preview](#preview)
  - [Wins + Challenges](#wins-and-challenges)
  - [Authors](#Authors)

This project was developed using Next.js and is hosted on Vercel.

## Setup

- Clone and run this repo [Backend Repo Here](https://github.com/rpoole444/cosLivewire-BE)
- Clone down this repo [Frontend Repo Here](https://github.com/rpoole444/cos-livewire-fe)
- On the command line, type: `$ npm install`
- On the command line, type: `$ npm run dev`
- Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
- If your artist profile is soft deleted, visit the dedicated [/artist-restore](/artist-restore) page to recover it.
- The page will reload if you make edits.\
You may also see any lint errors in the console.

## Technologies
  - Next.js / React
  - TypeScript
  - Tailwind CSS
  - Node.js
  - Express.js
  - PostgreSQL
  - Visual Studio Code
  - Git Version Control / GitHub
  - Vercel for deployment
  - Google Chrome or Web Browser of User's Choice

## Project Spec

Alpine Groove Guide is designed to revitalize the local music and events scene in Colorado Springs by providing a platform where community members can engage directly with event listings and eventually participate in community-driven radio broadcasts. This project is an extension of a traditional events calendar, integrating community input and providing a launchpad for a unique, localized radio streaming feature.

## Abstract 

The Alpine Groove Guide provides a dynamic platform for local artists and event organizers to share their events with a wide audience. The system supports event submission, which goes through an admin review process where events can be accepted, denied, or edited. Approved events are then displayed on the public-facing calendar. The platform is designed to eventually support streaming of community radio shows, further engaging the local creative community.

## Features

- Interactive calendar built with FullCalendar for browsing local events.
- Admin dashboard to review and manage submitted events.
- Soft-deleted artist profiles can be recovered via the dedicated [Artist Restore](/artist-restore) page.
- Responsive interface developed with TypeScript and Tailwind CSS.

## Learning Goals

- Develop a full-stack application using a modern JavaScript stack.
- Implement user authentication and admin authorization for content management.
- Utilize Tailwind CSS for rapid and responsive design.
- Integrate PostgreSQL for robust data management.

## Preview 

![Main Calendar View](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/caab5067-b64c-40ed-a681-d1f1b13f80a6)
![No Event Calendar View](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/a003b87a-0928-4668-8a36-891e6a6910ba)

![Main Calendar View Admin Signed in](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/131de6b9-a0dd-446a-9bc8-eb7eceef9ec4)
![Register User](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/a86b0298-3f0e-426a-b1a8-ab1a8c64da6f)

![Individual Event](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/1860b651-19d8-44e0-b0fd-205effac4671)
![Admin Review Interface](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/d4a1cd0e-14a9-46a8-84cf-346b1e70844f)
![Admin Interface](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/47cb7f08-2739-41a0-9fcf-cf1118be5c97)
![Event Submission Form](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/ae85e37e-1071-40ad-95d3-069f90c08357)
![User Profile](https://github.com/rpoole444/cos-livewire-fe/assets/111818942/04d9d4e7-dd3e-40f8-85ff-697344d2cea2)

## Wins & Challenges

- Successfully created a full-stack application with user authentication and dynamic content management.
- Implemented a responsive design using Tailwind CSS that adapts to various device screens.
- Implemented a robust soft-delete and restore workflow so artist profiles can be safely recovered.
- Managed complex state and data interactions using Node.js and Express on the server side with a PostgreSQL database.

- Setting up and configuring the authentication flow was challenging but essential for securing user data.
- Integrating Tailwind CSS for the first time presented a learning curve in understanding its utility-first approach.

## Authors

<table>
    <tr>
      <td> Your Name <a href="https://github.com/rpoole444">GH</a></td>
    </tr>
<td><img src="https://github.com/rpoole444/cos-livewire-fe/assets/111818942/018c44e7-bdce-4cde-9573-005d65721152" alt="Reid Poole"
 width="150" height="auto" /></td>
</table>

