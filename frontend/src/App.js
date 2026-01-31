import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { cities } from './cities';
import './App.css';

function App() {
  const [inputCity, setInputCity] = useState("San Francisco");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isCelsius, setIsCelsius] = useState(true);

  const fuse = new Fuse(cities, { threshold: 0.4 });

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

  const convertTemp = (temp) => {
    if (isCelsius) return temp;
    return Math.round((temp * 9) / 5 + 32);
  };

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

  const fetchWeather = async (cityToSearch) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const response = await fetch(`https://pysky-backend.onrender.com/api/weather?city=${cityToSearch}`);
      if (!response.ok) throw new Error("City not found");
      const data = await response.json();

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

      setForecast(data.forecast.map(item => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric' }),
        temp: Math.round(item.main.temp),
        icon: getIcon(item.weather[0].icon),
        desc: item.weather[0].main
      })));
      
      setInputCity(data.city_info.name); 
    } catch (err) {
      setError("City not found. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("San Francisco");
  }, []);

  if (loading && !weather) return <div className="loader">Loading PySky...</div>;

  return (
    // UPDATED: Dynamic background class based on weather condition
    <div className={`container ${weather?.condition.toLowerCase()}`}>
      <div className="content-wrapper">
        <header>
          <div className="header-top">
            <h1>PySky Weather</h1>
            <button className="unit-btn" onClick={() => setIsCelsius(!isCelsius)}>
              {isCelsius ? "→ °F" : "→ °C"}
            </button>
          </div>
          
          <div className="search-wrapper">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search city..." 
                value={inputCity}
                onChange={onInputChange}
                onKeyDown={(e) => e.key === 'Enter' && fetchWeather(inputCity)}
              />
              <button className="search-btn" onClick={() => fetchWeather(inputCity)}>
                <i className="ph-bold ph-magnifying-glass"></i>
              </button>
            </div>

            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.slice(0, 5).map((city, index) => (
                  <li key={index} onClick={() => fetchWeather(city)}>
                    <i className="ph ph-map-pin"></i> {city}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="error-msg">{error}</p>}
        </header>

        {weather && (
          <main className="main-grid">
            {/* MAIN SECTION (70%) */}
            <div className="card main-card">
              <div className="weather-header">
                <h2 className="city-name">{weather.city}</h2>
                <p className="weather-status">{weather.condition}</p>
              </div>

              <div className="temp-container">
                <div className="temp">
                  {convertTemp(weather.temp)}<span>°{isCelsius ? 'C' : 'F'}</span>
                </div>
                <i className={`ph-fill ${getIcon(weather.iconCode)} main-icon`}></i>
                <div className="temp-details">
                  <p>Feels like {convertTemp(weather.feelsLike)}°</p>
                  <p>L: {convertTemp(weather.min)}° | H: {convertTemp(weather.max)}°</p>
                </div>
              </div>

              <div className="highlights-grid">
                <div className="highlight-item"><span>Humidity</span><strong>{weather.humidity}</strong></div>
                <div className="highlight-item"><span>Wind</span><strong>{weather.windSpeed} {weather.windDir}</strong></div>
                <div className="highlight-item"><span>Pressure</span><strong>{weather.pressure}</strong></div>
                <div className="highlight-item"><span>Visibility</span><strong>{weather.visibility}</strong></div>
              </div>

              <div className="sun-times">
                <div className="sun-box"><i className="ph-fill ph-sun-horizon"></i> {weather.sunrise}</div>
                <div className="sun-box"><i className="ph-fill ph-moon-stars"></i> {weather.sunset}</div>
              </div>
            </div>

            {/* SIDEBAR SECTION (30%) */}
            <div className="forecast-section">
              <h3 className="section-title">Next 24 Hours</h3>
              <div className="forecast-row">
                {forecast.slice(0, 8).map((item, index) => (
                  <div className="forecast-card" key={index}>
                    <span className="time">{item.time}</span>
                    <i className={`forecast-icon ${item.icon}`}></i> 
                    <span className="temp">{convertTemp(item.temp)}°</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;