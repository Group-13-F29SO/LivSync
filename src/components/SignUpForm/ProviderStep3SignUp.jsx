export default function ProviderStep3SignUp({ formData, handleChange, handleNext, isLoading }) {
  const specialties = [
    'Cardiologist',
    'Dermatologist',
    'Endocrinologist',
    'Gastroenterologist',
    'General Practitioner',
    'Neurologist',
    'Oncologist',
    'Orthopedic Surgeon',
    'Pediatrician',
    'Psychiatrist',
    'Pulmonologist',
    'Rheumatologist',
    'Urologist',
    'Other'
  ];

  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Professional Information
      </h1>
      <p className="text-center text-gray-600 mb-8 text-sm">
        Tell us about your medical specialty
      </p>

      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Medical Specialty
          </label>
          <select
            value={formData.specialty || ''}
            onChange={(e) => handleChange('specialty', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors bg-white text-gray-900"
            required
          >
            <option value="">Select your specialty</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>
    </>
  );
}
