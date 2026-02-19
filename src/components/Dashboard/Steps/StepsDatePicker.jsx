export default function StepsDatePicker({ selectedDate, onDateChange, disabled = false }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <label htmlFor="date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Date:
      </label>
      <input
        id="date-picker"
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
    </div>
  );
}
