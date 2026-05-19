import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  ClipboardList,
} from "lucide-react";

type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "hajimari-tasks";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review Q3 financial report",
    description: "Go through the quarterly report and prepare summary notes.",
    priority: "high",
    completed: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "Update project documentation",
    description: "Ensure all API docs are up to date with the latest changes.",
    priority: "medium",
    completed: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment.",
    priority: "high",
    completed: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    title: "Team retrospective meeting",
    description: "Prepare agenda and collect feedback for the sprint retrospective.",
    priority: "low",
    completed: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    title: "Design new landing page",
    description: "Create mockups for the redesigned marketing landing page.",
    priority: "medium",
    completed: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  high: {
    label: "High",
    color: "bg-red-100 text-red-700 ring-1 ring-red-200",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    color: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    color: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch {
        setTasks(initialTasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
      }
    } else {
      setTasks(initialTasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setShowForm(false);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = tasks.filter((t) => {
    const statusMatch =
      filter === "all" ? true : filter === "active" ? !t.completed : t.completed;
    const priorityMatch = priorityFilter === "all" ? true : t.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Task Manager</h1>
            <p className="text-slate-500 mt-1">
              Track and manage your tasks and to-dos.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F87C62] hover:bg-[#f06a4e] text-white font-semibold rounded-xl transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: totalCount, color: "text-slate-700" },
            { label: "Active", value: activeCount, color: "text-[#F87C62]" },
            { label: "Completed", value: completedCount, color: "text-emerald-600" },
            { label: "Completion", value: `${completionPct}%`, color: "text-[#0F3752]" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-[#F87C62]">
              {completionPct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: "linear-gradient(90deg, #F87C62, #FF9A85)",
              }}
            />
          </div>
        </div>

        {/* Add Task Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-800">New Task</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={addTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F87C62]/30 focus:border-[#F87C62]/60 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F87C62]/30 focus:border-[#F87C62]/60 transition-all text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                          newPriority === p
                            ? priorityConfig[p].color
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#F87C62] hover:bg-[#f06a4e] text-white font-semibold rounded-xl transition-all text-sm"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="flex gap-1.5">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? "bg-[#F87C62] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  priorityFilter === p
                    ? p === "all"
                      ? "bg-slate-700 text-white"
                      : priorityConfig[p as Priority].color
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {p === "all" ? "All Priorities" : p}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-slate-400">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-slate-700 font-semibold mb-1">No tasks found</h3>
              <p className="text-slate-400 text-sm">
                {filter === "completed"
                  ? "No completed tasks yet."
                  : "Add a new task to get started."}
              </p>
            </div>
          ) : (
            filtered.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                  task.completed
                    ? "border-slate-100 opacity-70"
                    : "border-slate-100 hover:border-[#F87C62]/20 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      task.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 hover:border-[#F87C62]"
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white fill-emerald-500" />
                    ) : (
                      <Circle className="w-3 h-3 opacity-0" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`font-semibold text-sm ${
                            task.completed
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-slate-500 text-sm mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${
                              priorityConfig[task.priority].color
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                priorityConfig[task.priority].dot
                              }`}
                            />
                            {priorityConfig[task.priority].label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(task.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
