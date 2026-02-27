# What's Next?
A web application that suggests movies, TV series, documentaries, anime, etc. based on your preferences using the TMDB API.

## Project Structure
This repository contains the backend server, and provides a space (`public/`) for the frontend application.

* `src/`: Backend logic, controllers, services, and routes.
* `public/`: The frontend application (HTML, CSS, Vanilla JS). The backend serves files from this directory statically.
* `server.js`: The main entry point for the Express backend.

## Setting Up

### Prerequisites
1. You must have **Node.js** and **npm** installed.
2. You need a **TMDB API Key** (from [The Movie Database](https://developer.themoviedb.org/docs/getting-started)).

### Installation
1. Clone this repository.
2. Run `npm install` in the rooot directory to install all backend dependencies.
3. Create a `.env` file based on `.env.example`:
   ```bash
   PORT=3000
   TMDB_API_KEY=your_actual_api_key_here
   ```

### Running the Project
* **Development Mode (Auto-restarts on change):**
  ```bash
  npm run dev
  ```
* **Standard Start:**
  ```bash
  npm start
  ```

Once running, the backend API will be available at `http://localhost:3000/api` and the frontend will be served at `http://localhost:3000/`.

## API Endpoints Overview
* `GET /api/config`: Get TMDB configuration data (image base URLs).
* `GET /api/genres?type=(movie|tv)`: Get movie or TV genre lists.
* `GET /api/suggestions`: Get content suggestions.
  * Query Params:
    * `type`: `movie`, `tv`, `anime`, `documentary` (default `movie`)
    * `genre`: Optional TMDB genre ID
    * `rating`: Optional minimum rating (e.g., `7.0`)
    * `page`: Optional page number
    * `sort_by`: Optional sort string (default `popularity.desc`)
