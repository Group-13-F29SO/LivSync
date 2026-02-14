export default function ProviderStep2SignUp({ formData, handleChange, handleNext }) {
  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Professional Information
      </h1>
      <p className="text-center text-gray-600 mb-8 text-sm">
        Tell us about yourself
      </p>

      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Medical License Number
          </label>
          <input
            type="text"
            value={formData.medicalLicenseNumber}
            onChange={(e) => handleChange('medicalLicenseNumber', e.target.value)}
            placeholder="Enter your medical license number"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Clinic/Hospital/Organization Name
          </label>
          <input
            type="text"
            value={formData.workplaceName}
            onChange={(e) => handleChange('workplaceName', e.target.value)}
            placeholder="Enter your workplace name"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
        >
          Continue
          <span>→</span>
        </button>
      </form>
    </>
  );
}
