import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Text,
  useProductContext,
  Textfield,
  Form,
  Button,
  Badge,
  Popup,
  FormSection,
  FormFooter,
  Label,
  RequiredAsterisk,
  useForm,
  RadioGroup,
  ErrorMessage,
  Box,
  Inline,
  xcss,
  Heading,
  Strong,
  Image,
  Stack,
  Lozenge,
} from "@forge/react";

import { invoke, view } from "@forge/bridge";

let currentCC = null;

// Weather-based suggestions engine
const getWeatherSuggestions = (weather) => {
  if (!weather) return [];

  const temp = weather.main.temp;
  const condition = weather.weather[0].main.toLowerCase();
  const humidity = weather.main.humidity;
  const windSpeed = weather.wind?.speed || 0;

  const suggestions = [];

  // Temperature-based suggestions
  if (temp < 10) {
    suggestions.push({
      type: "productivity",
      icon: "☕",
      title: "Perfect Indoor Focus Time",
      description: "Cold weather = cozy coding! Great for tackling complex bugs and deep work.",
      priority: "high"
    });
    suggestions.push({
      type: "team",
      icon: "🏠",
      title: "Virtual Meeting Day",
      description: "Consider scheduling video calls instead of outdoor client meetings.",
      priority: "medium"
    });
  } else if (temp > 25) {
    suggestions.push({
      type: "team",
      icon: "🌞",
      title: "Outdoor Meeting Weather",
      description: "Great day for walking meetings, outdoor brainstorming, or client visits!",
      priority: "high"
    });
    suggestions.push({
      type: "health",
      icon: "💧",
      title: "Stay Hydrated",
      description: "Warm weather reminder: Keep water nearby during long coding sessions.",
      priority: "medium"
    });
  }

  // Condition-based suggestions
  if (condition.includes('rain')) {
    suggestions.push({
      type: "productivity",
      icon: "🌧️",
      title: "Rain = Debug Day",
      description: "Perfect weather for indoor debugging sessions and code reviews!",
      priority: "high"
    });
    suggestions.push({
      type: "planning",
      icon: "📅",
      title: "Postpone Outdoor Tasks",
      description: "Consider rescheduling any outdoor client meetings or site visits.",
      priority: "medium"
    });
  }

  if (condition.includes('storm') || condition.includes('thunder')) {
    suggestions.push({
      type: "alert",
      icon: "⚡",
      title: "Storm Alert",
      description: "Severe weather detected. Ensure backup systems are ready and remote work is enabled.",
      priority: "critical"
    });
  }

  if (condition.includes('clear') || condition.includes('sun')) {
    suggestions.push({
      type: "team",
      icon: "🌅",
      title: "Team Morale Boost",
      description: "Sunny weather ahead! Great day for team bonding activities or outdoor lunch breaks.",
      priority: "medium"
    });
  }

  if (condition.includes('cloud')) {
    suggestions.push({
      type: "productivity",
      icon: "☁️",
      title: "Steady Work Weather",
      description: "Cloudy skies are perfect for maintaining focus without weather distractions.",
      priority: "low"
    });
  }

  // Humidity-based suggestions
  if (humidity > 80) {
    suggestions.push({
      type: "health",
      icon: "💨",
      title: "High Humidity Alert",
      description: "Consider improving workspace ventilation for comfort during long work sessions.",
      priority: "medium"
    });
  }

  // Wind-based suggestions
  if (windSpeed > 10) {
    suggestions.push({
      type: "planning",
      icon: "💨",
      title: "Windy Conditions",
      description: "Strong winds detected. Indoor meetings recommended over outdoor activities.",
      priority: "medium"
    });
  }

  // Seasonal productivity tips
  const month = new Date().getMonth();
  if (month >= 11 || month <= 1) { // Winter months
    suggestions.push({
      type: "motivation",
      icon: "❄️",
      title: "Winter Productivity Mode",
      description: "Embrace the cozy season! Perfect time for planning Q1 goals and code refactoring.",
      priority: "low"
    });
  }

  // Always include a general suggestion
  suggestions.push({
    type: "general",
    icon: "🎯",
    title: "Weather-Optimized Workflow",
    description: `Current conditions (${temp}°C, ${condition}) are ideal for ${temp < 15 ? 'focused indoor work' : temp > 25 ? 'collaborative outdoor activities' : 'balanced indoor-outdoor tasks'}.`,
    priority: "low"
  });

  return suggestions.slice(0, 5); // Return top 5 suggestions
};

const SuggestionCard = ({ suggestion }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const cardStyle = xcss({
    padding: "space.100",
    marginBottom: "space.050",
    border: "1px solid",
    borderColor: "color.border",
    borderRadius: "border.radius",
    backgroundColor: "elevation.surface.raised",
  });

  return (
    <Box xcss={cardStyle}>
      <Stack space="space.050">
        <Inline space="space.100" alignBlock="center">
          <Text>{suggestion.icon}</Text>
          <Strong>{suggestion.title}</Strong>
          <Lozenge appearance={getPriorityColor(suggestion.priority)}>
            {suggestion.priority}
          </Lozenge>
        </Inline>
        <Text>{suggestion.description}</Text>
      </Stack>
    </Box>
  );
};

export const Edit = () => {
  const { handleSubmit, register, getValues, formState } = useForm();
  const [locationOptions, setLocationOptions] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { errors } = formState;

  const getOptions = () => {
    const values = getValues();

    if (values.city && values.country) {
      if (
        currentCC &&
        currentCC.city == values.city &&
        currentCC.country == values.country
      ) {
      } else {
        currentCC = {
          city: values.city,
          country: values.country,
        };

        invoke("getLocationCoordinates", { location: values }).then((val) => {
          setLocationOptions(val);
          setShowOptions(true);
        });
      }
    }
  };

  const configureGadget = (data) => {
    view.submit(locationOptions[data.location]);
  };

  function locationOption(obj, index, array) {
    return {
      name: "location",
      label: obj.name + ", " + obj.state + ", " + obj.country,
      value: index,
    };
  }

  return (
    <>
      <Form onSubmit={handleSubmit(configureGadget)}>
        <FormSection>
          <Label>
            City
            <RequiredAsterisk />
          </Label>
          <Textfield
            {...register("city", { required: true, onChange: getOptions() })}
          />
          <Label>
            Country
            <RequiredAsterisk />
          </Label>
          <Textfield {...register("country", { required: true })} />
          {showOptions && (
            <Label>
              Select your location
              <RequiredAsterisk />
            </Label>
          )}
          {showOptions && (
            <RadioGroup
              {...register("location", { required: true })}
              options={locationOptions.map(locationOption)}
            />
          )}
          {errors["location"] && <ErrorMessage>Select a location</ErrorMessage>}
        </FormSection>
        <FormFooter>
          {showOptions && (
            <Button appearance="primary" type="submit">
              Submit
            </Button>
          )}
        </FormFooter>
      </Form>
    </>
  );
};

const View = () => {
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const context = useProductContext();

  useEffect(() => {
    invoke("getText", { example: "my-invoke-variable" }).then(setData);
  }, []);

  useEffect(() => {
    invoke("getCurrentWeather").then((weatherData) => {
      setWeather(weatherData);
      if (weatherData) {
        const weatherSuggestions = getWeatherSuggestions(weatherData);
        setSuggestions(weatherSuggestions);
      }
    });
  }, []);

  const containerStyle = xcss({
    padding: "space.200",
  });

  const popupContentStyle = xcss({
    padding: "space.300",
    width: "320px",
    maxHeight: "400px",
    overflowY: "auto",
  });

  const weatherCardStyle = xcss({
    padding: "space.150",
    border: "1px solid",
    borderColor: "color.border",
    borderRadius: "border.radius",
    backgroundColor: "elevation.surface.raised",
    marginBottom: "space.100",
  });

  const getWeatherEmoji = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return '⛈️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('clear') || conditionLower.includes('sun')) return '☀️';
    return '🌤️';
  };

  if (!context) {
    return "Loading...";
  }

  const {
    extension: { gadgetConfiguration },
  } = context;

  return (
    <>
      <Heading as="h2">
        {getWeatherEmoji(weather?.weather[0]?.main)} {weather ? weather.name : "Loading..."} Weather
      </Heading>
      
      <Box xcss={containerStyle}>
        <Box xcss={weatherCardStyle}>
          <Inline space="space.200" alignBlock="start">
            <Image
              src={
                weather
                  ? `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
                  : "https://openweathermap.org/img/wn/01d@2x.png"
              }
              alt={weather ? weather.weather[0].description : "Loading"}
            />
            <Stack space="space.100">
              <Text>
                <Strong>Current Temperature</Strong>{" "}
                <Badge appearance="primary">{weather ? Math.round(weather.main.temp) : "[ ]"}</Badge> °C
              </Text>
              <Text>
                <Strong>Feels like:</Strong>{" "}
                <Badge appearance="default">{weather ? Math.round(weather.main.feels_like) : "[ ]"}</Badge> °C
              </Text>
              <Text>
                <Strong>Humidity:</Strong>{" "}
                <Badge appearance="default">{weather ? weather.main.humidity : "[ ]"}</Badge> %
              </Text>
              {weather?.weather[0]?.description && (
                <Text>
                  <Strong>Conditions:</Strong>{" "}
                  <Badge appearance="subtle">
                    {weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1)}
                  </Badge>
                </Text>
              )}
            </Stack>
          </Inline>
        </Box>

        <Popup
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          placement="right-start"
          content={() => (
            <Box xcss={popupContentStyle}>
              <Stack space="space.100">
                <Heading as="h3">🎯 Smart Work Suggestions</Heading>
                <Text>Based on current weather conditions:</Text>
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <SuggestionCard key={index} suggestion={suggestion} />
                  ))
                ) : (
                  <Text>Loading personalized suggestions...</Text>
                )}
                <Box xcss={xcss({ paddingTop: "space.100", borderTop: "1px solid", borderColor: "color.border" })}>
                  <Text>
                    <Strong>💡 Pro Tip:</Strong> Weather can impact team productivity and mood. 
                    Use these insights to optimize your team's workflow!
                  </Text>
                </Box>
              </Stack>
            </Box>
          )}
          trigger={() => (
            <Button
              appearance="primary"
              isSelected={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? "Hide" : "Get Smart"} Suggestions 🧠
            </Button>
          )}
        />
      </Box>
    </>
  );
};

const App = () => {
  const context = useProductContext();
  if (!context) {
    return "This is never displayed...";
  }

  return context.extension.entryPoint === "edit" ? <Edit /> : <View />;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);