import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import axios from 'axios';
import { cities } from './cities';
import './App.css';

function App() {
  const [inputCity, setInputCity] = useState("San Francisco"); // Current text in search box
  const [weather, setWeather] = useState(null); // Live weather data from Django
  const [forecast, setForecast] = useState([]); // 3-hour forecast data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]); // Fuzzy search results

  // Initialize Fuse.js for fuzzy searching
  const fuse = new Fuse(cities, {
    threshold: 0.4, // Lower is more strict, higher is more "fuzzy"
  });

  // Handle typing in the search bar
  const onInputChange = (e) => {
    const value = e.target.value;
    setInputCity(value);

    if (value.length > 1) {
      const results = fuse.search(value);
      setSuggestions(results.map(r => r.item));
    } else {
      setSuggestions([]);
    }
  };

  // Helper: Map OpenWeather icon codes to Phosphor icons
  const getIcon = (code) => {
    const map = {
      '01d': 'ph-sun', '01n': 'ph-moon',
      '02d': 'ph-cloud-sun', '02n': 'ph-cloud-moon',
      '03d': 'ph-cloud', '03n': 'ph-cloud',
      '04d': 'ph-cloud', '04n': 'ph-cloud',
      '09d': 'ph-cloud-rain', '09n': 'ph-cloud-rain',
      '10d': 'ph-cloud-rain', '10n': 'ph-cloud-rain',
      '11d': 'ph-cloud-lightning', '11n': 'ph-cloud-lightning',
      '13d': 'ph-snow', '13n': 'ph-snow',
      '50d': 'ph-cloud-fog', '50n': 'ph-cloud-fog'
    };
    return map[code] || 'ph-question';
  };

  const getWindDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  const formatTime = (timestamp, timezoneOffset) => {
    return new Date((timestamp + timezoneOffset) * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Main API Call to your Django Backend
  const fetchWeather = async (cityToSearch) => {
    setLoading(true);
    setError(null);
    setSuggestions([]); // Close suggestions when a search starts
    try {
      const response = await fetch(`https://pysky-backend.onrender.com/api/weather?city=${city}`);
      // const data = response.data;
      const data = await response.json(); // This is the correct way for fetch()
      
      setWeather({
        city: data.city_info.name,
        condition: data.current.weather[0].main,
        temp: Math.round(data.current.main.temp),
        feelsLike: Math.round(data.current.main.feels_like),
        min: Math.round(data.current.main.temp_min),
        max: Math.round(data.current.main.temp_max),
        humidity: `${data.current.main.humidity}%`,
        windSpeed: `${data.current.wind.speed} m/s`,
        windDir: getWindDirection(data.current.wind.deg),
        pressure: `${data.current.main.pressure} hPa`,
        visibility: `${(data.current.visibility / 1000).toFixed(1)} km`,
        cloudiness: `${data.current.clouds.all}%`,
        sunrise: formatTime(data.current.sys.sunrise, data.current.timezone),
        sunset: formatTime(data.current.sys.sunset, data.current.timezone),
        iconCode: data.current.weather[0].icon
      });

      const forecastList = data.forecast.map(item => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric' }),
        temp: Math.round(item.main.temp),
        icon: getIcon(item.weather[0].icon),
        desc: item.weather[0].main
      }));
      setForecast(forecastList);
      setInputCity(data.city_info.name); // Sync input with official city name
    } catch (err) {
      setError("City not found. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("San Francisco");
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchWeather(inputCity);
    }
  };

  if (loading && !weather) return <div className="container" style={{textAlign:'center', marginTop: '50px'}}>Loading...</div>;

  return (
    <div className="container">
      <header>
        <h1>Weather App</h1>
        <p className="subtitle">Real-time weather data</p>
        
        {/* Search Wrapper for Suggestions Positioning */}
        <div className="search-wrapper" style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search city..." 
              value={inputCity}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
            />
            <button className="search-btn" onClick={() => fetchWeather(inputCity)}>
              <i className="ph-bold ph-magnifying-glass"></i>
            </button>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.slice(0, 5).map((city, index) => (
                <li key={index} onClick={() => fetchWeather(city)}>
                  <i className="ph ph-map-pin" style={{marginRight: '10px'}}></i>
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p style={{color: '#ff4d4d', marginTop: '10px', textAlign: 'center'}}>{error}</p>}
      </header>

      {weather && (
        <main className="main-grid">
          <div className="card">
            <div className="weather-header">
              <h2 className="city-name">{weather.city}</h2>
              <p className="weather-status">{weather.condition}</p>
            </div>

            <div className="temp-container">
              <div className="temp">{weather.temp}<span>°</span></div>
              <i className={`ph-fill ${getIcon(weather.iconCode)}`} style={{fontSize: '64px', color: '#fff'}}></i>
              <div className="temp-details">
                <p>Feels like {weather.feelsLike}°</p>
                <p>Min: {weather.min}° | Max: {weather.max}°</p>
              </div>
            </div>

            <div className="highlights-grid">
              <div className="highlight-card"><div className="highlight-title">Humidity</div><div className="highlight-value">{weather.humidity}</div></div>
              <div className="highlight-card"><div className="highlight-title">Wind Speed</div><div className="highlight-value">{weather.windSpeed}</div></div>
              <div className="highlight-card"><div className="highlight-title">Wind Direction</div><div className="highlight-value" style={{display: 'flex', alignItems: 'center', gap: '5px'}}><i className="ph-fill ph-arrow-up-right"></i> {weather.windDir}</div></div>
              <div className="highlight-card"><div className="highlight-title">Pressure</div><div className="highlight-value" style={{color: '#0095FF'}}>{weather.pressure}</div></div>
              <div className="highlight-card"><div className="highlight-title">Visibility</div><div className="highlight-value" style={{color: '#0095FF'}}>{weather.visibility}</div></div>
              <div className="highlight-card"><div className="highlight-title">Cloudiness</div><div className="highlight-value" style={{color: '#0095FF'}}>{weather.cloudiness}</div></div>
            </div>

            <div className="sun-times">
              <div className="sun-item"><i className="ph-fill ph-sun-horizon" style={{color: '#FFD700', fontSize: '24px'}}></i><div><div style={{fontSize: '12px', color: '#9399A2'}}>Sunrise</div><div>{weather.sunrise}</div></div></div>
              <div className="sun-item"><i className="ph-fill ph-moon-stars" style={{color: '#FFD700', fontSize: '24px'}}></i><div><div style={{fontSize: '12px', color: '#9399A2'}}>Sunset</div><div>{weather.sunset}</div></div></div>
            </div>
          </div>

          <div className="forecast-section">
            <h3 className="forecast-title">3-Hour Forecast</h3>
            <div className="forecast-row">
              {forecast.map((item, index) => (
                <div className="forecast-card" key={index}>
                  <span className="forecast-time">{item.time}</span>
                  <i className={`forecast-icon ${item.icon}`}></i> 
                  <span className="forecast-temp">{item.temp}°</span>
                  <span className="forecast-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;