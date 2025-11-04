Weather App - Instructions
--------------------------

Files:
  - index.html
  - style.css
  - script.js

Where to insert your API key:
  Open script.js and replace the string 'REPLACE_WITH_YOUR_API_KEY' in the API_KEY constant.
  Example:
    const API_KEY = 'your_actual_api_key_here';

How to run locally:
  1. Download and unzip the project.
  2. Open index.html in a browser (double-click). For most browsers this works.
     If you run into CORS or "file://" issues, run a simple local server:
     - Python 3:
         cd weather-app
         python -m http.server 8000
         then open http://localhost:8000 in your browser
     - Node (http-server):
         npm install -g http-server
         http-server
         then open the printed local URL.

Notes:
  - The app uses OpenWeatherMap's current weather API and the icon images from openweathermap.org.
  - Ensure your API key is valid and has not exceeded free tier limits.
  - Geolocation will ask the browser for permission. If denied, use the search box instead.

Enjoy! :)
