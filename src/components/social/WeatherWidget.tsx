import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle } from 'lucide-react';

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
  location?: string;
}

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export default function WeatherWidget({ latitude, longitude, locationName }: WeatherWidgetProps = {}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadWeather();
  }, [latitude, longitude]);

  async function loadWeather() {
    try {
      if (latitude && longitude) {
        await fetchWeatherData(latitude, longitude, locationName);
      } else if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherData(latitude, longitude, 'Your Location');
          },
          () => {
            setError(true);
            setLoading(false);
          }
        );
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading weather:', err);
      setError(true);
      setLoading(false);
    }
  }

  async function fetchWeatherData(lat: number, lon: number, locName?: string) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`
      );

      if (!response.ok) throw new Error('Weather fetch failed');

      const data = await response.json();

      const weatherCondition = getWeatherCondition(data.current.weather_code);

      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];

      const forecast = data.daily.time.slice(0, 3).map((time: string, index: number) => {
        const forecastDateStr = time;

        const daysDiff = (() => {
          if (forecastDateStr === todayDateStr) return 0;

          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          if (forecastDateStr === tomorrowStr) return 1;

          return 2;
        })();

        let dayLabel = '';
        if (daysDiff === 0) {
          dayLabel = 'Today';
        } else if (daysDiff === 1) {
          dayLabel = 'Tomorrow';
        } else {
          const [year, month, day] = time.split('-').map(Number);
          const displayDate = new Date(year, month - 1, day);
          dayLabel = displayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }

        return {
          day: dayLabel,
          high: Math.round(data.daily.temperature_2m_max[index]),
          low: Math.round(data.daily.temperature_2m_min[index]),
          condition: getWeatherCondition(data.daily.weather_code[index])
        };
      });

      setWeather({
        current: {
          temp: Math.round(data.current.temperature_2m),
          condition: weatherCondition,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m)
        },
        forecast,
        location: locName
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(true);
      setLoading(false);
    }
  }

  function getWeatherCondition(code: number): string {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Cloudy';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  }

  function getWeatherIcon(condition: string) {
    switch (condition) {
      case 'Clear':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'Partly Cloudy':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      case 'Cloudy':
        return <Cloud className="w-8 h-8 text-slate-500" />;
      case 'Rain':
      case 'Showers':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      default:
        return <Cloud className="w-8 h-8 text-slate-400" />;
    }
  }

  function getSmallWeatherIcon(condition: string) {
    switch (condition) {
      case 'Clear':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'Partly Cloudy':
        return <Cloud className="w-5 h-5 text-slate-400" />;
      case 'Cloudy':
        return <Cloud className="w-5 h-5 text-slate-500" />;
      case 'Rain':
      case 'Showers':
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      default:
        return <Cloud className="w-5 h-5 text-slate-400" />;
    }
  }

  if (loading) return null;
  if (error || !weather) return null;

  const isGoodForOutdoor =
    weather.current.condition !== 'Rain' &&
    weather.current.condition !== 'Showers' &&
    weather.current.windSpeed < 15;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80">
        <div>
          <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
            Court Conditions
          </h2>
          {weather.location && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {weather.location}
            </p>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.current.condition)}
            <div>
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {weather.current.temp}°
              </div>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {weather.current.condition}
              </div>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-full ${
            isGoodForOutdoor
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
          }`}>
            <div className="text-xs font-bold">
              {isGoodForOutdoor ? 'Great' : 'Fair'}
            </div>
            <div className="text-[10px] font-semibold">
              for outdoor
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">Wind</span>
            <span className="font-bold text-slate-900 dark:text-white ml-auto">
              {weather.current.windSpeed} mph
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">Humidity</span>
            <span className="font-bold text-slate-900 dark:text-white ml-auto">
              {weather.current.humidity}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            3-Day Forecast
          </div>
          <div className="grid grid-cols-3 gap-3">
            {weather.forecast.map((day, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center"
              >
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  {day.day}
                </div>
                <div className="flex justify-center mb-2">
                  {getSmallWeatherIcon(day.condition)}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {day.high}°
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">/</span>
                  <span className="text-slate-500 dark:text-slate-500">
                    {day.low}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isGoodForOutdoor && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-700 dark:text-orange-400">
              Consider indoor courts or check weather updates before booking outdoor courts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
