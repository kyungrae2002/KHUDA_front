# Travel Buddy (AI Travel Planner) ✈️

Travel Buddy is an intelligent web application that automatically generates personalized travel itineraries by analyzing your KakaoTalk conversation exports. Simply upload your chat history with friends or family, and the AI will extract your travel destination, dates, budget, headcount, transport preferences, and wishlists to craft the perfect trip!

## ✨ Key Features

- **KakaoTalk Chat Parsing**: Upload a `.txt` or `.csv` export of your KakaoTalk chat. The app extracts text while respecting privacy.
- **AI Slot Extraction**: Automatically identifies 7 key travel slots (Destination, Date, Budget, Headcount, Transport, Constraints, and Wishlist) based on the chat context.
- **Interactive Chat Interface**: If any slots are missing or ambiguous, the AI will chat with you to clarify the details before generating the itinerary.
- **Smart Itinerary Generation**: Uses AI to build a logical, day-by-day travel plan, taking your constraints and wishlists into account.
- **Interactive Map View**: Visualizes your daily routes using the Google Maps API, including driving/transit directions.
- **Modern UI**: Built with React and Tailwind CSS, featuring beautiful micro-animations, glassmorphism, and responsive layouts.

## 🛠 Tech Stack

- **Frontend Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Maps Integration**: `@react-google-maps/api` (Google Maps JS API & Directions API)
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 🚀 Getting Started

### Prerequisites

You will need Node.js installed on your machine. You will also need a backend server or configure the app to run in mock mode.

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd khuda_advanced
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add the following keys (see `.env.example`):
   ```env
   VITE_BACKEND_API_URL=http://127.0.0.1:8080
   VITE_LLM_API_URL=https://api.openai.com/v1
   VITE_LLM_MODEL=gpt-4o-mini
   VITE_LLM_API_KEY=your_openai_api_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_USE_MOCK=false
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🗺 Application Flow

1. **Upload Phase**: Users drop their KakaoTalk chat export file. The app parses it client-side.
2. **Chat & Slot Extraction**: The AI reviews the chat context and fills out travel parameters. Users can chat with the AI to refine or fill missing information.
3. **Plan Generation**: Once all parameters are confirmed, an itinerary is generated containing day-by-day narratives and a structured list of places.
4. **Map & Explore**: The generated plan is displayed on a beautifully styled timeline and an interactive Google Map with route visualization.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check issues page.

## 📝 License

This project is licensed under the MIT License.
