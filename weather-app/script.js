// script.js - Weather app logic using async/await and OpenWeatherMap API

/* =======================
   IMPORTANT:
   Insert your OpenWeatherMap API key in the `API_KEY` constant below.
   Get a free API key at: https://openweathermap.org/api
   ======================= */
const API_KEY = '16473c88e1edfc00ea936e9650470841' // <-- Put your API key here

// DOM elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const statusEl = document.getElementById('status');
const cardContainer = document.getElementById('cardContainer');
const weatherCard = document.getElementById('weatherCard');

const weatherIcon = document.getElementById('weatherIcon');
const tempEl = document.getElementById('temp');
const conditionEl = document.getElementById('condition');
const cityEl = document.getElementById('city');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');

// Helper: show loading state
function showLoading(text = 'Fetching weather...') {
  statusEl.innerHTML = `<span class="spinner" role="status" aria-hidden="true"></span>${text}`;
  statusEl.classList.remove('error');
}

// Helper: show error
function showError(message = 'City not found') {
  statusEl.textContent = message;
  statusEl.classList.add('error');
  cardContainer.classList.add('hidden');
}

// Helper: clear status
function clearStatus() {
  statusEl.textContent = '';
  statusEl.classList.remove('error');
}

// Build OpenWeatherMap URL for city or coordinates
function buildUrl({ city, lat, lon }) {
  if (city) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  } else {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  }
}

// Fetch weather (async/await) and update UI.
// Accepts an object: { city } or { lat, lon }
async function fetchWeather(params) {
  try {
    clearStatus();
    showLoading();

    const url = buildUrl(params);
    const res = await fetch(url);

    if (!res.ok) {
      // If city not found or other client error
      throw new Error('City not found');
    }

    const data = await res.json();
    // Update UI with data
    updateCard(data);
    clearStatus();
  } catch (err) {
    console.error(err);
    showError(err.message || 'Unable to fetch weather');
  }
}

// Update the card DOM with OpenWeatherMap response
function updateCard(data) {
  // Data shape (partial): data.main.temp, data.weather[0].icon, data.name, data.wind.speed, data.main.humidity
  const temp = Math.round(data.main.temp);
  const condition = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  weatherIcon.src = iconUrl;
  weatherIcon.alt = condition;
  tempEl.textContent = `${temp}°C`;
  conditionEl.textContent = capitalize(condition);
  cityEl.textContent = `${data.name}, ${data.sys?.country || ''}`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} m/s`;

  // show card with animation
  cardContainer.classList.remove('hidden');
  setTimeout(() => {
    weatherCard.classList.add('show');
  }, 10);
}

// Capitalize helper
function capitalize(str = '') {
  return str.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

// Event listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError('Please enter a city name');
    return;
  }
  fetchWeather({ city });
});

// Enter key submits
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// Geolocation button: get current position and fetch by lat/lon
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Geolocation not supported by your browser');
    return;
  }
  showLoading('Detecting location...');
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    fetchWeather({ lat: latitude, lon: longitude });
  }, (err) => {
    console.error(err);
    showError('Unable to retrieve your location');
  }, { timeout: 10000 });
});

// On load: optionally detect user location automatically
window.addEventListener('load', () => {
  // Attempt to use geolocation if the user allows it
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      fetchWeather({ lat: latitude, lon: longitude });
    }, (err) => {
      // If user denies or it fails, simply do nothing and wait for manual search
      console.log('Geolocation unavailable or denied:', err.message);
    }, { timeout: 7000 });
  }
});
