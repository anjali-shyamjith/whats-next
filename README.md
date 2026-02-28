<p align="center">
  <img src="./img.png" alt="Project Banner" width="100%">
</p>

# WHAT'S NEXT? 🎯

## Basic Details

### Team Name: Mad HackerX

### Team Members
- Member 1: K NIVEDITHA MANOHARAN- College Of Engineering Thalasssery
- Member 2: ANJALI SHYAMJITH - College Of Engineering Thalasssery

### Hosted Project Link
https://whats-next-snowy.vercel.app/index.html

### Project Description
What's Next? takes the guesswork out of movie nights. 
Just tell us how you're feeling, and we'll match you with the perfect film, series, documentary, or anime — tailored to your mood, every time.

### The Problem statement
People often spend more time searching for something to watch than actually watching it. With so much content available, it's easy to feel overwhelmed and end up watching nothing at all.
Most platforms recommend content based on what you've watched before — but they don't consider how you're feeling right now. A person who's happy wants something very different from someone who's stressed, sad, or bored.
What's Next? solves this by asking one simple question — "How are you feeling?" — and using your mood and preferred genre to instantly suggest the perfect movie, series, documentary, or anime for that moment.

### The Solution
What's Next? is a web application that recommends movies, TV series, documentaries, and anime based on the user's current mood and preferred genre.
Instead of scrolling endlessly or relying on what you watched last week, the app makes it simple:

Select your mood — Happy, Sad, Stressed, Bored, Romantic, Adventurous, and more
Pick a genre — Action, Comedy, Horror, Drama, Sci-Fi, and more
Get instant recommendations — curated content that actually matches how you feel right now

The app connects to the TMDB API to pull real, up-to-date content and filters results based on the mood-genre combination the user selects — delivering a personalised, stress-free viewing experience in seconds.
No accounts. No algorithms tracking you. Just your mood and your next great watch.

---

## Technical Details

### Technologies/Components Used

**For Software:**
Languages: JavaScript (ES6+), HTML5, CSS3

Backend: Node.js, Express.js, Axios, axios-retry, dotenv, cors, morgan

Frontend: Vanilla JS, CSS Custom Properties (Variables), Google Fonts

Tools & APIs: npm, TMDB API, Fetch API

---

## Features

List the key features of your project:
Mood & Genre Filtering: Personalized suggestions based on current emotional state.

"Surprise Me": Instant random high-rated recommendation from selected categories.

Smart Recommendations: Advanced discovery based on traits of multiple "Past Watches."

Rich Detail Views: Comprehensive info including full cast, crew, and high-res posters.

Privacy-First: No accounts or tracking; recommendations are purely session-based.

Reliable Performance: Built-in API retries and local metadata fallbacks for stability.

#### Screenshots (Add at least 3)

[Screenshots](https://drive.google.com/drive/u/1/folders/1nodaH0OYnjK30YiMcvXTzLh6huxYTolJ)

#### Diagrams

**System Architecture:**

![Architecture Diagram](https://drive.google.com/drive/u/0/folders/1vgNfIdIb7cY1qFGEUbrT7tsZz0Yx62bG)
User → Category → Filters → Taste Seeding (3-5 titles)
         ↓
   Fetch user history + TMDB metadata
         ↓
   TMDB API (central resolver)
         ↓
   Ranked results (high→low) → Displayed to user
         ↓
   User DB updated (watchlist, interactions)

**Application Workflow:**

![Workflow](https://drive.google.com/drive/u/0/folders/1vgNfIdIb7cY1qFGEUbrT7tsZz0Yx62bG)
Home + Filters → Taste Seeding → Recommendations Grid
                      ↓
              Profile / Watchlist (accessible throughout)

## Project Demo

### Video
[Video recording](https://drive.google.com/drive/u/0/folders/1M_ZI-7ksLsIzD8GFXHtVmDHafHVGYtaB)

---

## AI Tools Used (Optional - For Transparency Bonus)

**Tool Used:** ChatGPT, Claude, Antigravity

## Team Contributions

- K NIVEDITHA MANOHARAN: Frontend development
- ANJALI SHYAMJITH: Backend development

Made with ❤️ at TinkerHub
