# Pebble Diary Server

Pebble Diary is a RESTful API server that generates diary entries based on Stack Overflow data. Users can submit Stack Overflow URLs, and the server will fetch questions and answers, summarize the content, and generate an image for each entry. The entries are stored by user ID and date.

## Features

- Fetch and parse Stack Overflow questions and answers from provided URLs
- Group and concatenate entries based on date, summarizing content when necessary
- Generate custom images for each entry
- Store diary entries in a MySQL database, with options to view past entries grouped by date
- Swagger documentation for API endpoints

## Requirements

- Node.js >= 14
- MySQL database
- OpenAI API key (for GPT and DALL-E API access)
- Axios, Cheerio, and Express for server and parsing setup

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/pebble-diary-server.git
    cd pebble-diary-server
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Configure the environment variables:
   - Create a `.env` file in the project root directory:
     ```plaintext
     OPENAI_API_KEY=your_openai_api_key
     MYSQL_HOST=localhost
     MYSQL_USER=your_mysql_user
     MYSQL_PASSWORD=your_mysql_password
     MYSQL_DATABASE=your_database_name
     ```
  
4. Set up the MySQL database:
   - Run the following SQL command in your MySQL instance to create the `diary` table:
     ```sql
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

## Usage

1. Start the server:
    ```bash
    npm start
    ```

2. Access Swagger documentation at:
   - [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## API Endpoints

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

## License
This project is licensed under the MIT License. See the LICENSE file for details