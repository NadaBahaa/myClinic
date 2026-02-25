import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Clock,
  Bell,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "../App";
import type { Appointment } from "./CalendarView";
import DailyCalendar from "./DailyCalendar";
import MonthlyCalendar from "./MonthlyCalendar";
import PatientsOfDayView from "./PatientsOfDayView";
import PatientsView from "./PatientsView";

// Mock appointments for the logged-in doctor
const getDoctorAppointments = (
  doctorId: string,
): Appointment[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    {
      id: "1",
      patientId: "p1",
      patientName: "Emma Wilson",
      doctorId,
      doctorName: "Dr. Sarah Johnson",
      serviceId: "s1",
      serviceName: "Facial Treatment",
      date: today,
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      status: "scheduled",
      notes: "First visit",
    },
    {
      id: "3",
      patientId: "p3",
      patientName: "Sophia Davis",
      doctorId,
      doctorName: "Dr. Sarah Johnson",
      serviceId: "s3",
      serviceName: "Botox Injection",
      date: today,
      startTime: "14:00",
      endTime: "14:30",
      duration: 30,
      status: "scheduled",
    },
    {
      id: "5",
      patientId: "p4",
      patientName: "Ava Martinez",
      doctorId,
      doctorName: "Dr. Sarah Johnson",
      serviceId: "s4",
      serviceName: "Chemical Peel",
      date: tomorrow,
      startTime: "10:00",
      endTime: "10:45",
      duration: 45,
      status: "scheduled",
    },
  ];
};

export default function DoctorPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"calendar" | "patients-day" | "my-patients">("calendar");
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(
    user ? getDoctorAppointments(user.id) : []
  );

  if (!user) return null;

  // Determine available views based on user permissions
  const showDailyView = user.permissions.showCalendar;
  const showMonthlyView = user.permissions.showCalendar;

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "daily") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "daily") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = () => {
    if (view === "daily") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    const today = new Date();
    return (
      aptDate.getDate() === today.getDate() &&
      aptDate.getMonth() === today.getMonth() &&
      aptDate.getFullYear() === today.getFullYear()
    );
  });

  const currentViewAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    if (view === "daily") {
      return (
        aptDate.getDate() === currentDate.getDate() &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    } else {
      return (
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    }
  });

  const handleStatusChange = (
    appointmentId: string,
    newStatus: Appointment["status"],
  ) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, status: newStatus }
          : apt,
      ),
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl text-gray-900">
              Doctor Portal
            </h1>
            <p className="text-sm text-gray-600">
              {user?.name}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === "calendar"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar className="w-5 h-5" />
              My Schedule
            </button>
            <button
              onClick={() => setActiveTab("patients-day")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === "patients-day"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Bell className="w-5 h-5" />
              Patients of the Day
            </button>
            <button
              onClick={() => setActiveTab("my-patients")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === "my-patients"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              My Patients
            </button>
          </div>
        </div>

        {/* Patients of the Day Tab */}
        {activeTab === "patients-day" && (
          <PatientsOfDayView
            appointments={appointments}
            userRole="doctor"
            currentUserId={user.id}
          />
        )}

        {/* My Patients Tab */}
        {activeTab === "my-patients" && (
          <PatientsView isDoctorView={true} doctorId={user.id} doctorName={user.name} />
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="text-gray-600">
                    Today's Appointments
                  </span>
                </div>
                <p className="text-3xl text-gray-900">
                  {todayAppointments.length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-600">
                    Total Patients
                  </span>
                </div>
                <p className="text-3xl text-gray-900">
                  {
                    new Set(appointments.map((a) => a.patientId))
                      .size
                  }
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-600">
                    Next Appointment
                  </span>
                </div>
                <p className="text-lg text-gray-900">
                  {todayAppointments.length > 0
                    ? todayAppointments[0].startTime
                    : "None"}
                </p>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl text-gray-900 mb-2">
                  My Schedule
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg text-gray-700 min-w-[200px] text-center">
                    {formatDate()}
                  </span>
                  <button
                    onClick={handleNext}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ml-2"
                  >
                    Today
                  </button>
                </div>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView("daily")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    view === "daily"
                      ? "bg-white shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setView("monthly")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    view === "monthly"
                      ? "bg-white shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Calendar View */}
            {view === "daily" && showDailyView && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg text-gray-900">
                    Daily Schedule
                  </h3>
                </div>
                <DailyCalendar
                  date={currentDate}
                  appointments={appointments}
                  onAppointmentUpdate={(apt) =>
                    setAppointments((prev) =>
                      prev.map((a) => (a.id === apt.id ? apt : a)),
                    )
                  }
                  onAppointmentDelete={(id) =>
                    setAppointments((prev) =>
                      prev.filter((a) => a.id !== id),
                    )
                  }
                  onAppointmentEdit={() => {}}
                />
              </div>
            )}

            {view === "monthly" && showMonthlyView && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg text-gray-900">
                    Monthly Overview
                  </h3>
                </div>
                <MonthlyCalendar
                  date={currentDate}
                  appointments={appointments}
                  onDateSelect={(date) => {
                    setCurrentDate(date);
                    if (showDailyView) {
                      setView("daily");
                    }
                  }}
                />
              </div>
            )}

            {/* Appointments List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg text-gray-900 mb-4">
                {view === "daily"
                  ? "Today's Appointments"
                  : "This Month's Appointments"}
              </h3>

              {currentViewAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  No appointments scheduled for this{" "}
                  {view === "daily" ? "day" : "month"}.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentViewAppointments
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() -
                          new Date(b.date).getTime() ||
                        a.startTime.localeCompare(b.startTime),
                    )
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-lg text-gray-900">
                                  {apt.patientName}
                                </h4>
                                <p className="text-pink-600">
                                  {apt.serviceName}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  apt.status === "scheduled"
                                    ? "bg-blue-100 text-blue-700"
                                    : apt.status === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {apt.status
                                  .charAt(0)
                                  .toUpperCase() +
                                  apt.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(
                                  apt.date,
                                ).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {apt.startTime} - {apt.endTime} (
                                {apt.duration} min)
                              </div>
                            </div>
                            {apt.notes && (
                              <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                Note: {apt.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {apt.status === "scheduled" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      apt.id,
                                      "completed",
                                    )
                                  }
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      apt.id,
                                      "cancelled",
                                    )
                                  }
                                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}