import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  precipitation_chance: number;
  wind_speed: number;
  is_suitable_for_play: boolean;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 72,
    condition: 'Partly Cloudy',
    precipitation_chance: 10,
    wind_speed: 5,
    is_suitable_for_play: true
  });

  function getWeatherIcon() {
    if (weather.condition.toLowerCase().includes('rain')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (weather.condition.toLowerCase().includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    } else {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">Current Weather</h3>
        {getWeatherIcon()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Temperature</span>
          <span className="font-bold text-2xl">{weather.temperature}°F</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Condition</span>
          <span className="font-medium">{weather.condition}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Precipitation</span>
          <span className="font-medium">{weather.precipitation_chance}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Wind className="w-4 h-4" />
            Wind
          </span>
          <span className="font-medium">{weather.wind_speed} mph</span>
        </div>

        <div className={`mt-4 p-3 rounded-lg text-center font-medium ${
          weather.is_suitable_for_play
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {weather.is_suitable_for_play ? 'Great conditions for play!' : 'Weather not ideal'}
        </div>
      </div>
    </div>
  );
}
