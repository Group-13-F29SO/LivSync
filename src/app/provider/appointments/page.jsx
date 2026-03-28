'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, User } from 'lucide-react';
import { appointmentService } from '@/services/appointmentService';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'book'

  // Form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Redirect if not authenticated as provider
  useEffect(() => {
    if (!authLoading && (!user || user.userType !== 'provider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch appointments on component mount
  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
      fetchPatients();
    }
  }, [user?.id]);

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/provider/appointments/list');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch connected patients
  const fetchPatients = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/provider/get-patients?providerId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  // Fetch available time slots
  const fetchAvailableSlots = async (date) => {
    try {
      setSlotsLoading(true);
      const response = await fetch(
        `/api/provider/appointments/available-slots?date=${date}`
      );
      if (!response.ok) throw new Error('Failed to fetch available slots');
      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
      setSelectedTime(''); // Reset time selection
    } catch (err) {
      console.error('Failed to load available slots:', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Book appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPatient || !selectedDate || !selectedTime) {
      setError('Please select patient, date, and time');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/provider/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to book appointment');
      }

      setSuccess('Appointment booked successfully!');
      await fetchAppointments();
      resetForm();
      setTimeout(() => setActiveTab('list'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedPatient('');
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
    setAvailableSlots([]);
  };

  // Get minimum and maximum dates
  const minDate = appointmentService.getMinimumDate().toISOString().split('T')[0];
  const maxDate = appointmentService
    .getMaximumDate(30)
    .toISOString()
    .split('T')[0];

  // Filter out weekend dates
  const isDateDisabled = (dateStr) => {
    return appointmentService.isWeekend(new Date(dateStr));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={32} className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Appointments
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and schedule patient appointments with your connected patients
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 font-medium">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            All Appointments
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg ${
              activeTab === 'book'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            Book New Appointment
          </button>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={24} className="text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upcoming Appointments
              </h2>
            </div>
            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">
                Loading appointments...
              </p>
            ) : appointments.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No appointments scheduled yet
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-lg hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-indigo-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {appointment.patients.first_name}{' '}
                          {appointment.patients.last_name}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          appointment.status === 'scheduled'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                            : appointment.status === 'completed'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/30 rounded">
                        <Calendar size={16} className="text-purple-500 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            Date:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {appointmentService.formatDate(
                              appointment.appointment_date
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/30 rounded">
                        <Clock size={16} className="text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            Time:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {appointmentService.formatTo12Hour(
                              appointment.appointment_time
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-white/50 dark:bg-gray-900/30 rounded">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          Email:
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white text-xs break-all">
                          {appointment.patients.email}
                        </p>
                      </div>
                      {appointment.notes && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                          <span className="text-amber-800 dark:text-amber-200 text-xs font-medium">
                            Notes:
                          </span>
                          <p className="mt-1 text-amber-900 dark:text-amber-100 text-xs">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={24} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Schedule New Appointment
              </h2>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-6">
              <div>
                <label
                  htmlFor="patient"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
                >
                  <User size={16} className="inline mr-2 text-indigo-600 dark:text-indigo-400" />
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <select
                  id="patient"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300 font-medium">
                    ⚠️ No connected patients available. Connect with patients first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
                >
                  <Calendar size={16} className="inline mr-2 text-gray-600 dark:text-gray-400" />
                  Select Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Weekends (Saturday & Sunday) are not available
                </p>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <Clock size={16} className="inline mr-2 text-gray-600 dark:text-gray-400" />
                    Select Time <span className="text-red-500">*</span>
                  </label>
                  {slotsLoading ? (
                    <p className="text-gray-600 dark:text-gray-400">⏳ Loading available times...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      ⚠️ No time slots available for this date. Please select another date.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`p-2 text-sm font-medium rounded transition-all ${
                              selectedTime === slot
                                ? 'bg-indigo-600 text-white border border-indigo-700 shadow-lg'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
                            }`}
                          >
                            {appointmentService.formatTo12Hour(slot)}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        🍽️ Lunch break: 12:30 PM - 1:00 PM (not available)
                      </p>
                    </>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
                >
                  Notes <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the appointment..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || !selectedPatient || !selectedDate || !selectedTime}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {loading ? '⏳ Booking...' : '✓ Book Appointment'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
