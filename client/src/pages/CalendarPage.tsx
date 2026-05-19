import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CalendarDays,
} from "lucide-react";

const STORAGE_KEY = "hajimari-calendar-events";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  color: string;
  description?: string;
}

const EVENT_COLORS = [
  { value: "orange", bg: "bg-[#F87C62]", light: "bg-orange-100 text-orange-700" },
  { value: "navy", bg: "bg-[#0F3752]", light: "bg-blue-100 text-blue-800" },
  { value: "emerald", bg: "bg-emerald-500", light: "bg-emerald-100 text-emerald-700" },
  { value: "amber", bg: "bg-amber-500", light: "bg-amber-100 text-amber-700" },
  { value: "purple", bg: "bg-purple-500", light: "bg-purple-100 text-purple-700" },
  { value: "red", bg: "bg-red-500", light: "bg-red-100 text-red-700" },
];

function getColorBg(color: string) {
  return EVENT_COLORS.find((c) => c.value === color)?.bg ?? "bg-[#F87C62]";
}
function getColorLight(color: string) {
  return EVENT_COLORS.find((c) => c.value === color)?.light ?? "bg-orange-100 text-orange-700";
}

function makeInitialEvents(): CalendarEvent[] {
  const today = new Date();
  return [
    {
      id: "1",
      title: "Team Stand-up",
      date: format(today, "yyyy-MM-dd"),
      color: "orange",
      description: "Daily team sync at 9am",
    },
    {
      id: "2",
      title: "Project Review",
      date: format(addDays(today, 2), "yyyy-MM-dd"),
      color: "navy",
      description: "Q3 project review with stakeholders",
    },
    {
      id: "3",
      title: "Design Sprint",
      date: format(addDays(today, 5), "yyyy-MM-dd"),
      color: "emerald",
      description: "2-day design sprint kickoff",
    },
    {
      id: "4",
      title: "Client Meeting",
      date: format(addDays(today, -2), "yyyy-MM-dd"),
      color: "amber",
      description: "Monthly client progress update",
    },
    {
      id: "5",
      title: "Release v2.0",
      date: format(addDays(today, 10), "yyyy-MM-dd"),
      color: "red",
      description: "Production release for version 2.0",
    },
  ];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("orange");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch {
        const initial = makeInitialEvents();
        setEvents(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } else {
      const initial = makeInitialEvents();
      setEvents(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, []);

  useEffect(() => {
    if (events.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

  const getEventsForDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return events.filter((e) => e.date === key);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDate) return;
    const ev: CalendarEvent = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      date: format(selectedDate, "yyyy-MM-dd"),
      color: newColor,
      description: newDescription.trim(),
    };
    setEvents((prev) => [...prev, ev]);
    setNewTitle("");
    setNewDescription("");
    setNewColor("orange");
    setShowForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let cur = calStart;
  while (cur <= calEnd) {
    days.push(cur);
    cur = addDays(cur, 1);
  }

  // Upcoming events (next 14 days)
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const upcoming = events
    .filter((e) => {
      const d = parseISO(e.date).getTime();
      const diff = (d - todayMs) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <p className="text-slate-500 mt-1">Manage your schedule and events.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToday}
                  className="px-3 py-1.5 text-sm font-medium text-[#F87C62] hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDate(day); setShowForm(false); }}
                    className={`min-h-[80px] p-1.5 border-b border-r border-slate-50 text-left transition-all ${
                      !isCurrentMonth ? "bg-slate-50/50" : "bg-white hover:bg-orange-50/30"
                    } ${isSelected ? "ring-2 ring-inset ring-[#F87C62]/50" : ""}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1 ${
                        isTodayDate
                          ? "bg-[#F87C62] text-white"
                          : isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-xs px-1.5 py-0.5 rounded-md truncate font-medium ${getColorLight(ev.color)}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-400 font-medium px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Selected date panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">
                      {format(selectedDate, "EEEE, MMM d")}
                    </h3>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F87C62] hover:bg-[#f06a4e] text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Event
                    </button>
                  </div>

                  {showForm && (
                    <form
                      onSubmit={handleAddEvent}
                      className="mb-4 space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Enter event title"
                          required
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F87C62]/30 focus:border-[#F87C62]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Optional details"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F87C62]/30 focus:border-[#F87C62]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Color
                        </label>
                        <div className="flex gap-2">
                          {EVENT_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setNewColor(c.value)}
                              className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                                newColor === c.value
                                  ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                                  : "hover:scale-110"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-[#F87C62] hover:bg-[#f06a4e] text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {getEventsForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <CalendarDays className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-sm">No events for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getEventsForDate(selectedDate).map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${getColorBg(ev.color)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {ev.title}
                            </p>
                            {ev.description && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="w-6 h-6 text-[#F87C62]" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Select a day</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Click any date to view or add events
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming events */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">
                Upcoming Events
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  No upcoming events in the next 14 days.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((ev) => {
                    const evDate = parseISO(ev.date);
                    return (
                      <div key={ev.id} className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${getColorLight(ev.color)} flex items-center justify-center shrink-0 text-xs font-bold`}
                        >
                          {format(evDate, "d")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {format(evDate, "EEE, MMM d")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
