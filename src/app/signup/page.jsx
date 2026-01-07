'use client';

import { useState } from 'react';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
    biologicalSex: '',
    height: '',
    weight: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Final submission
      console.log('Form submitted:', formData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600">
      {/* Card */}
      <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl">
        
        {/* Step 1: Email & Password */}
        {step === 1 && (
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
                className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Continue
              </button>
            </form>
          </>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
              Let's get to know you
            </h1>
            <p className="text-center text-gray-600 mb-8 text-sm">
              Tell us your name to personalise your experience
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

              <button
                type="submit"
                className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
              >
                Continue
                <span>→</span>
              </button>
            </form>
          </>
        )}

        {/* Step 3: Basic Information */}
        {step === 3 && (
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
        )}

        {/* Step 4: Physical Stats */}
        {step === 4 && (
          <>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
              Physical Stats
            </h1>
            <p className="text-center text-gray-600 mb-8 text-sm">
              We'll use this to provide personalized insights
            </p>

            <form onSubmit={handleNext} className="space-y-6">
              <div>
                <label className="block text-black text-sm font-medium mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder="Enter your height in cm"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-black text-sm font-medium mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder="Enter your weight in kg"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Continue
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
