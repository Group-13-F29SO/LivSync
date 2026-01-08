export default function Step3SignUp({ formData, handleChange, handleNext }) {
  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Basic Information
      </h1>
      <p className="text-center text-gray-600 mb-8 text-sm">
        This helps us calculate your metrics
      </p>

      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Age
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="Enter your age"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-black text-sm font-medium mb-3">
            Biological Sex
          </label>
          <div className="space-y-3">
            {['Male', 'Female', 'Prefer not to say'].map((option) => (
              <label
                key={option}
                className="flex items-center p-3 rounded-lg border-2 border-white cursor-pointer hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <input
                  type="radio"
                  name="biologicalSex"
                  value={option}
                  checked={formData.biologicalSex === option}
                  onChange={(e) => handleChange('biologicalSex', e.target.value)}
                  className="w-4 h-4 accent-blue-600"
                  required
                />
                <span className="ml-3 text-black">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow"
        >
          Continue
        </button>
      </form>
    </>
  );
}
