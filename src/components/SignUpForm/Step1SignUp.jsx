export default function Step1SignUp({ formData, handleChange, handleNext, isLoading }) {
  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Welcome to LivSync
      </h1>
      <p className="text-center text-gray-600 mb-8 text-sm">
        Begin your wellness journey today
      </p>

      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="Enter your username"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Continue'}
        </button>
      </form>
    </>
  );
}
