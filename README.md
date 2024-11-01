# Pebble - Automatic AI TIL Picture Diary

## Overview

Pebble is a generative AI service that automatically creates a personalized diary of your studies, based on your Chrome search history. This project leverages Express for the backend, React for the frontend, and JavaScript to seamlessly integrate a Chrome extension that captures browsing data. Using AI, Pebble generates meaningful summaries, images, and entries for each day, giving you a reflective diary about your learning journey.

## Screenshots


### Calendar View
![image](https://github.com/user-attachments/assets/5f7b412b-2a62-464f-8917-dc6795c9e8a4)


### Diary Entry
![image](https://github.com/user-attachments/assets/c72f04e2-362f-477a-b5d3-1e4252af12a3)

### Chrome Extenstion
![image](https://github.com/user-attachments/assets/274c3f56-3f61-4d34-832d-9bc25fb1a63d)

## Tech Stack

![image](https://github.com/user-attachments/assets/b29c040c-6303-4bf5-913b-3b9cc104ff3e)


- **Backend**: Express, Node.js, MySQL, AWS

- **Frontend**: React

- **Chrome Extension**: JavaScript, Chrome Storage API

- **Generative AI**: OpenAI API (GPT-4, DALL-E 3)

## Folder Structure

```
Pebble
├─ Pebble.chrome_extension
│  └─ chrome_extension
├─ Pebble.server
│  ├─ config
│  ├─ controllers
│  └─ routes
└─ Pebble.web
    ├─ public
    └─ src
        └─ Pages
```

- **Pebble.chrome_extension**: Contains the Chrome extension code for capturing browsing history.

- **Pebble.server**: Backend Express server for handling diary entries, APIs, and database operations.

    - **config**: Configuration files, including environment variables and database connection.

    - **controllers**: Handles business logic for diary operations.

    - **routes**: Defines API endpoints for generating and retrieving diary entries.

- **Pebble.web**: React frontend for viewing diary entries.

    - **public**: Static assets.

    - **src/Pages**: React components for rendering calendar and diary pages.

## Features

- **Chrome Extension**: Collects search history, specifically Stack Overflow URLs.

- **Backend API**: Generates diary entries from your browsing history and provides RESTful APIs for data retrieval. Uses OpenAI API to generate titles, summaries, and visual content for diary entries.

- **Frontend Interface**: Allows users to view and interact with diary entries on a calendar.


## Installation

### Prerequisites

- `Node.js` and `npm` installed

- `MySQL` database setup

- `Chrome Browser` for extension use

### Backend Setup

1. Clone the repository:
```
git clone https://github.com/SeungjaeLim/pebble.git
cd pebble/Pebble.server
```
2. Install dependencies:
```
npm install
```
3. Set up environment variables:

- Create a `.env` file in the project root directory with the following content:
    ```
    OPENAI_API_KEY=your_openai_api_key
    MYSQL_HOST=localhost
    MYSQL_USER=your_mysql_user
    MYSQL_PASSWORD=your_mysql_password
    MYSQL_DATABASE=your_database_name
    ```
- Set up MySQL database:
    ```
    CREATE TABLE IF NOT EXISTS diary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        date DATE,
        picture TEXT,
        title VARCHAR(255),
        post TEXT,
        parsed_post TEXT,
        url TEXT,
        UNIQUE INDEX idx_user_url (user_id, url)
    );
    ```
4. Run the server:
```
npm run start
```
Server will run on `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
```
cd ../Pebble.web
```

2. Install dependencies:
```
npm install
```

3. Run the frontend:
```
npm start
```
The frontend will run on `http://localhost:3000`.

### Chrome Extension Setup

1. Navigate to `Pebble.chrome_extension/chrome_extension`.

2. Open Chrome and go to `chrome://extensions/`.

3. Enable `Developer mode` and click `Load unpacked`.

4. Select the `chrome_extension` folder to load the extension.

## Usage

1. Collect Browsing History: Use the Chrome extension to capture search history when visiting Stack Overflow.

2. Generate Diary: The backend will use the collected URLs to generate diary entries, leveraging OpenAI to create titles, summaries, and images.

3. View Diary: Use the React frontend to view your generated diary entries. Navigate through the calendar to select specific days.

## API Documentation

Swagger documentation is available at `http://localhost:8000/api-docs` after running the backend server. It provides detailed information on the following endpoints:

### `POST /api/diary/generate`

Generates diary entries based on provided Stack Overflow URLs for a specific user.

- **Request Body**:
  ```json
  {
    "userid": "string",
    "history": [
      {
        "date": "YYYY-MM-DD",
        "url": "https://stackoverflow.com/questions/sample-question"
      }
    ]
  }

- **Response**:
    - `201 Created`: Diary entries generated successfully.
    - `500 Internal Server Error`: Failed to generate diary entries.

### `GET /api/diary/get_diary/{userId}`

Retrieves diary entries for a specified user, grouped by date.

- **Path Parameters**:

    - `userId (string)`: ID of the user to retrieve diary entries for.

- **Response**:

    - `200 OK`: Returns user-specific diary entries grouped by date.
    - `500 Internal Server Error`: Database query error.


## Contributing

1. Fork the repository.

2. Create your feature branch (`git checkout -b feature/AmazingFeature`).

3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).

4. Push to the branch (`git push origin feature/AmazingFeature`).

5. Open a pull request.

## License

Distributed under the MIT License. See `LICENSE` for more information.