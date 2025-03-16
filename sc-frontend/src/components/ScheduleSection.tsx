// src/components/ScheduleSection.tsx
import { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";

interface Event {
  id: number;
  title: string;
  location: string;
  time: string;
  date: string; // ISO date string (e.g., "2025-03-05")
  status: "inProgress" | "upcoming";
  registeredUsers?: number;
}

interface ScheduleSectionProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  registeredEvents: number[]; // Array of registered event IDs
}

const ScheduleSection = ({ selectedDate, setSelectedDate, registeredEvents }: ScheduleSectionProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);

  // Fetch events from backend when component mounts or registeredEvents changes
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage for fetching events");
          return;
        }
        console.log("Fetching events for ScheduleSection, registeredEvents:", registeredEvents);
        const response = await axios.get("http://localhost:5000/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedEvents = response.data.map((event: Event) => ({
          ...event,
          status: "upcoming", // Will be updated dynamically below
        }));
        console.log("Fetched events for ScheduleSection:", fetchedEvents);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events for ScheduleSection:", error);
      }
    };
    fetchEvents();
  }, [registeredEvents]); // Re-fetch if registeredEvents changes

  // Function to parse time string and combine with date
  const getEventDateTime = (eventDate: string, eventTime: string) => {
    const [startTime, endTime] = eventTime.includes("-") ? eventTime.split(" - ") : [eventTime, eventTime];
    const [startHourMin, startPeriod] = startTime.trim().split(" ");
    const [endHourMin, endPeriod] = endTime ? endTime.trim().split(" ") : [startHourMin, startPeriod];
    const [startHour, startMinute] = startHourMin.split(":").map(Number);
    const [endHour, endMinute] = endHourMin.split(":").map(Number);

    let startHours = startHour;
    let endHours = endHour;
    if (startPeriod === "PM" && startHour !== 12) startHours += 12;
    if (endPeriod === "PM" && endHour !== 12) endHours += 12;
    if (startPeriod === "AM" && startHour === 12) startHours = 0;
    if (endPeriod === "AM" && endHour === 12) endHours = 0;

    const eventStart = new Date(eventDate);
    eventStart.setHours(startHours, startMinute, 0, 0);
    const eventEnd = endTime ? new Date(eventDate) : new Date(eventStart);
    eventEnd.setHours(endHours, endMinute || startMinute, 0, 0);

    return { start: eventStart, end: eventEnd };
  };

  // Dynamically determine event status
  const getDynamicStatus = (event: Event) => {
    const now = new Date();
    const { start, end } = getEventDateTime(event.date, event.time);
    if (now >= start && now <= end) {
      return "inProgress";
    }
    return "upcoming";
  };

  // Filter events for the selected date and check against registeredEvents
  const filteredEvents = events
    .map((event) => ({
      ...event,
      status: getDynamicStatus(event),
    }))
    .filter((event) => {
      const eventDate = new Date(event.date);
      const isSameDate = eventDate.toDateString() === selectedDate.toDateString();
      const isRegistered = registeredEvents.includes(event.id);
      console.log(
        `Event ID: ${event.id}, Date: ${event.date}, Is Same Date: ${isSameDate}, Is Registered: ${isRegistered}`
      );
      return isSameDate && isRegistered; // Show only registered events on the selected date
    });

  const getMonthName = (date: Date) => date.toLocaleString("default", { month: "long" });
  const getYear = (date: Date) => date.getFullYear();
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  // Determine label based on selected date
  const getScheduleLabel = () => {
    const today = new Date();
    if (selectedDate.toDateString() === today.toDateString()) {
      return "Today's Schedule";
    } else {
      return "Schedule";
    }
  };

  return (
    <div className="w-[400px] bg-gray-100 p-4 rounded-lg shadow-md mr-0 flex flex-col h-full">
      {/* Header with Label and Date on the Right */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{getScheduleLabel()}</h2>
        <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
          {selectedDate.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
      </div>

      {/* Calendar */}
      <div className="bg-white p-3 rounded-lg shadow-md mb-4">
        <div className="flex justify-between items-center mb-2">
          <button onClick={handlePrevMonth} className="text-gray-600 hover:text-[#FF7700]">
            <FaArrowLeft />
          </button>
          <h3 className="text-sm font-medium">
            {getMonthName(currentMonth)} {getYear(currentMonth)}
          </h3>
          <button onClick={handleNextMonth} className="text-gray-600 hover:text-[#FF7700]">
            <FaArrowRight />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div key={day} className="text-xs font-semibold text-gray-600">
              {day}
            </div>
          ))}
          {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
            const day = i + 1;
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();
            const isSelected =
              day === selectedDate.getDate() &&
              currentMonth.getMonth() === selectedDate.getMonth() &&
              currentMonth.getFullYear() === selectedDate.getFullYear();
            return (
              <div
                key={day}
                className={`text-xs p-1 rounded-full cursor-pointer ${
                  isSelected ? "bg-[#FF7700] text-white" : isToday ? "bg-orange-300" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events List (Showing registered events for selected date) */}
      <div className="mb-auto space-y-4 overflow-y-auto flex-1">
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-gray-500">No registered events for this date</p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-[#2a4066] text-white p-3 rounded-lg shadow-md flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      event.status === "inProgress" ? "bg-green-500" : "bg-yellow-400"
                    }`}
                  >
                    {event.status === "inProgress" ? "In Progress" : "Upcoming"}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Registered
                  </span>
                </div>
                <p className="text-sm">{event.time}</p>
                <p className="text-md font-medium">{event.title}</p>
                <p className="text-sm text-gray-500">{event.location}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleSection;