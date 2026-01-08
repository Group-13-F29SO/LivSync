'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Step1SignUp from '@/components/SignUpForm/Step1SignUp';
import Step2SignUp from '@/components/SignUpForm/Step2SignUp';
import Step3SignUp from '@/components/SignUpForm/Step3SignUp';
import Step4SignUp from '@/components/SignUpForm/Step4SignUp';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
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
    setError('');
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Final submission - send to API
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'An error occurred during signup');
          return;
        }

        // Signup successful - redirect to login or dashboard
        router.push('/login');
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Signup error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600">
      {/* Card */}
      <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        {/* Step 1: Email & Password */}
        {step === 1 && (
          <Step1SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} isLoading={isLoading} />
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <Step2SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} />
        )}

        {/* Step 3: Basic Information */}
        {step === 3 && (
          <Step3SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} />
        )}

        {/* Step 4: Physical Stats */}
        {step === 4 && (
          <Step4SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
