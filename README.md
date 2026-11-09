🌍 Public Holiday Planner

📌 Project Overview

Public Holiday Planner is a web-based application developed using Node.js and Express.js that allows users to explore public holidays across different countries and years. The application integrates the Nager.Date Public Holidays API to retrieve country information and official holiday details. It provides a simple and user-friendly interface for accessing holiday information through frontend and backend integration.

🎯 Project Objectives

- To provide easy access to public holiday information across different countries.
- To retrieve holiday details based on the selected country and year.
- To integrate external REST APIs for real-time data retrieval.
- To develop an efficient frontend and backend architecture.
- To implement data validation, error handling, and caching.
- To understand the practical implementation of cloud computing concepts.

✨ Key Features

- Country-based public holiday information.
- Dynamic retrieval of available countries.
- Holiday information based on selected year and country.
- Integration with the Nager.Date Public Holidays API.
- REST API communication between frontend and backend.
- Holiday filtering and sorting.
- One-hour in-memory caching for improved performance.
- Input validation and API error handling.
- Simple and user-friendly web interface.

🛠️ Technologies Used

Frontend:

- HTML5
- CSS3
- JavaScript

Backend:

- Node.js
- Express.js

API Integration:

- Nager.Date Public Holidays API
- REST API
- JSON

Development Tools:

- Visual Studio Code
- npm
- Git
- GitHub

🏗️ Project Architecture

The application follows a client-server architecture where the frontend communicates with the Express.js backend. The backend sends requests to the Nager.Date API, processes the retrieved holiday information, and returns the results to the frontend.

        User
         |
         v
  Frontend Interface
   (HTML, CSS, JS)
         |
         v
   Express.js Server
         |
         v
      API Routes
         |
         v
  Nager.Date Public
      Holidays API
         |
         v
   Holiday Information
         |
         v
   Backend Processing
         |
         v
  Display Results
      to User

📂 Project Structure

Public-Holiday-Planner/
│
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── server.js
├── package.json
├── package-lock.json
└── node_modules/

⚙️ Installation and Setup

1. Install Dependencies

npm install

2. Start the Application

npm start

3. Open in Browser

After successfully starting the server, open the following URL in your browser:

http://localhost:5000

🔗 API Integration

This project integrates the Nager.Date Public Holidays API to retrieve public holiday information for different countries.

API Base URL:

https://date.nager.at/api/v3

Available Countries API:

https://date.nager.at/api/v3/AvailableCountries

Public Holidays API:

https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}

The API provides structured JSON responses containing country and public holiday information, which is processed by the backend and displayed through the frontend interface.

📚 Learning Outcomes

- Understanding Node.js and Express.js application development.
- Learning client-server architecture.
- Implementing REST API integration.
- Working with JSON data and API responses.
- Understanding frontend and backend communication.
- Implementing server-side caching.
- Handling API errors and input validation.
- Gaining practical knowledge of cloud computing and web application development.

🚀 Future Enhancements

- Deploying the application on a cloud hosting platform.
- Implementing user authentication and personalized holiday planning.
- Adding calendar integration.
- Introducing holiday reminders and notifications.
- Providing advanced holiday search and filtering options.
- Developing a mobile-friendly application.

🌐 Application URL

Local Development URL:

http://localhost:5000

External API URL:

https://date.nager.at/api/v3

🎓 Project Category

Cloud Computing – Web Application Development

👩‍💻 Developed By

Vaishnavi M.
