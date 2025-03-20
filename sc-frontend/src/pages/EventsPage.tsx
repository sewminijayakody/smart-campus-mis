// src/pages/EventsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import studentImage from "../assets/images/Picture3.png"; // Replace with your image path
import axios, { AxiosError } from "axios";
import { useUser } from "../context/UserContext";

interface Event {
  id: number;
  title: string;
  location: string;
  time: string;
  date: string;
  registeredUsers?: number;
  registered?: boolean;
}

const EventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(
    (location.state?.selectedDate as Date) || new Date("2025-03-01")
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>(() => {
    const saved = localStorage.getItem("registeredEvents");
    console.log("Initial registeredEvents from localStorage:", saved);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date("2025-03-01")
  );
  const [renderKey, setRenderKey] = useState(Date.now());

  // Update state when location changes or on mount
  useEffect(() => {
    const state = location.state as {
      selectedDate?: Date;
      registeredEvents?: number[];
    };
    console.log("Location state on mount:", state);
    if (state?.selectedDate) {
      setSelectedDate(state.selectedDate);
    }
    if (state?.registeredEvents) {
      console.log(
        "Setting registeredEvents from location state:",
        state.registeredEvents
      );
      setRegisteredEvents(state.registeredEvents);
      localStorage.setItem(
        "registeredEvents",
        JSON.stringify(state.registeredEvents)
      );
    } else {
      fetchUserRegistrations();
    }
  }, [location]);

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }
        console.log("Fetching events with registeredEvents:", registeredEvents);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/events`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const fetchedEvents = response.data.map((event: Event) => {
          const isRegistered = registeredEvents.includes(event.id);
          console.log(`Event ID: ${event.id}, Is Registered: ${isRegistered}`);
          return {
            ...event,
            registered: isRegistered,
          };
        });
        console.log("Fetched events with registration status:", fetchedEvents);
        setEvents(fetchedEvents);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error(
          "Error fetching events:",
          axiosError.response?.data || axiosError.message || "Unknown error"
        );
      }
    };
    fetchEvents();
  }, [registeredEvents, selectedDate]);

  // Fetch user's registered events from backend
  const fetchUserRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for fetching registrations");
        return;
      }
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/events/registrations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const userRegistrations = response.data;
      console.log("Backend returned registrations:", userRegistrations);
      setRegisteredEvents(userRegistrations);
      localStorage.setItem(
        "registeredEvents",
        JSON.stringify(userRegistrations)
      );
      console.log("Updated registeredEvents after fetch:", userRegistrations);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error fetching user registrations:",
        axiosError.response?.data || axiosError.message || "Unknown error"
      );
    }
  };

  // Handle month navigation
  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
    );

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  // Handle event registration
  const handleRegister = async (eventId: number) => {
    try {
      if (registeredEvents.includes(eventId)) {
        console.log(`Event ${eventId} already registered`);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for registration");
        return;
      }

      console.log(`Registering for event ID: ${eventId}`);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/events/${eventId}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Registration response:", response.data);

      // Update registeredEvents
      const updatedRegisteredEvents = [...registeredEvents, eventId];
      console.log("New registeredEvents:", updatedRegisteredEvents);
      setRegisteredEvents(updatedRegisteredEvents);
      localStorage.setItem(
        "registeredEvents",
        JSON.stringify(updatedRegisteredEvents)
      );

      // Update events state to ensure UI reflects the change
      setEvents((prevEvents) => {
        const newEvents = prevEvents.map((evt) =>
          evt.id === eventId ? { ...evt, registered: true } : evt
        );
        console.log("Updated events after registration:", newEvents);
        return newEvents;
      });

      // Force re-render
      setRenderKey(Date.now());
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error registering for event:",
        axiosError.response?.data || axiosError.message || "Unknown error"
      );
    }
  };

  // Filter events for the selected date
  const filteredEvents = events.filter((evt) => {
    const eventDate = new Date(evt.date);
    console.log(
      "Comparing dates:",
      eventDate.toDateString(),
      selectedDate.toDateString()
    );
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Navigate back with updated states based on user role
  const handleBack = () => {
    navigate(
      user?.role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard",
      { state: { selectedDate, registeredEvents } }
    );
  };

  const getMonthName = (date: Date) =>
    date.toLocaleString("default", { month: "long" });
  const getYear = (date: Date) => date.getFullYear();
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  return (
    <div
      className="min-h-screen bg-gray-50 p-6 text-black relative"
      key={renderKey}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 mt-8 -ml-15">Events</h1>
        <div className="absolute top-6 right-6">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="flex space-x-6 mt-6">
          <div className="w-1/3 relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-[55%] h-64 overflow-hidden z-10 -ml-20 mt-60">
              <img
                src={studentImage}
                alt="Student with Books"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="bg-[#E7FFED] p-4 rounded-lg shadow-md border-45 border-[#D8F3E3] mt-16 flex justify-center">
              <div className="w-full max-w-sm">
                <div className="flex justify-between items-center mb-2">
                  <button
                    onClick={handlePrevMonth}
                    className="text-xxs font-medium text-gray-600 hover:text-[#FF7700]"
                  >
                    <FaArrowLeft />
                  </button>
                  <h3 className="text-xxs font-medium">
                    {getMonthName(currentMonth)} {getYear(currentMonth)}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="text-xxs font-medium text-gray-600 hover:text-[#FF7700]"
                  >
                    <FaArrowRight />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div
                      key={day}
                      className="text-xxs font-semibold text-gray-600"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from(
                    { length: getFirstDayOfMonth(currentMonth) },
                    (_, i) => (
                      <div key={`empty-${i}`} />
                    )
                  )}
                  {Array.from(
                    { length: getDaysInMonth(currentMonth) },
                    (_, i) => {
                      const day = i + 1;
                      const isSelected =
                        day === selectedDate.getDate() &&
                        currentMonth.getMonth() === selectedDate.getMonth() &&
                        currentMonth.getFullYear() ===
                          selectedDate.getFullYear();
                      const isToday =
                        day === new Date().getDate() &&
                        currentMonth.getMonth() === new Date().getMonth() &&
                        currentMonth.getFullYear() === new Date().getFullYear();
                      return (
                        <div
                          key={day}
                          className={`text-xxs p-1 rounded-full cursor-pointer ${
                            isSelected
                              ? "bg-[#FF7700] text-white"
                              : isToday
                              ? "bg-orange-300"
                              : "hover:bg-gray-200"
                          }`}
                          onClick={() => handleDateSelect(day)}
                        >
                          {day}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-2/3">
            <div
              className="bg-[#D8EAF3] p-4 rounded-lg shadow-md space-y-4 border border-[#D8EAF3] ml-11 mt-16"
              key={renderKey}
            >
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No events available for this date
                </p>
              ) : (
                filteredEvents.map((evt) => {
                  const isRegistered = registeredEvents.includes(evt.id);
                  console.log(
                    `Rendering event ID: ${evt.id}, Registered: ${isRegistered}`
                  );
                  return (
                    <div
                      key={evt.id}
                      className="bg-[#E7FFFF] p-4 rounded-lg flex items-start space-x-4"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <h3 className="text-md font-medium">{evt.title}</h3>
                        <p className="text-sm text-gray-600">{evt.location}</p>
                        <p className="text-sm">{evt.time}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(evt.date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>

                        {isRegistered ? (
                          <span className="ml-146 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRegister(evt.id)}
                            className="ml-146 text-xs bg-gray-200 text-blue-600 px-2 py-1 rounded-full"
                          >
                            Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
