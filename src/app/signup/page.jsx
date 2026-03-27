'use client';

import { useState } from 'react';
import Link from 'next/link';
import Step1SignUp from '@/components/SignUpForm/Step1SignUp';
import Step2SignUp from '@/components/SignUpForm/Step2SignUp';
import Step3SignUp from '@/components/SignUpForm/Step3SignUp';
import Step4SignUp from '@/components/SignUpForm/Step4SignUp';
import Step5SignUp from '@/components/SignUpForm/Step5SignUp';
import ProviderStep1SignUp from '@/components/SignUpForm/ProviderStep1SignUp';
import ProviderStep2SignUp from '@/components/SignUpForm/ProviderStep2SignUp';
import ProviderStep3SignUp from '@/components/SignUpForm/ProviderStep3SignUp';
import UserTypeSelector from '@/components/UserTypeSelector/UserTypeSelector';
import { useAuth } from '@/hooks/useAuth';

export default function SignUpPage() {
  const [userType, setUserType] = useState(null);
  const [step, setStep] = useState(1);
  const { signup, isLoading, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    age: '',
    biologicalSex: '',
    height: '',
    weight: '',
    connectedDevice: null,
    specialty: '',
    medicalLicenseNumber: '',
    workplaceName: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    if (userType === 'patient') {
      if (step < 5) {
        setStep(step + 1);
      } else {
        // Final submission for patient
        try {
          await signup({ ...formData, userType: 'patient' });
        } catch (err) {
          console.error('Signup error:', err);
        }
      }
    } else if (userType === 'provider') {
      if (step < 3) {
        setStep(step + 1);
      } else {
        // Final submission for provider
        try {
          await signup({ ...formData, userType: 'provider' });
        } catch (err) {
          console.error('Signup error:', err);
        }
      }
    }
  };

  const handleChangeUserType = (type) => {
    setUserType(type);
    setStep(1);
    setFormData({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      age: '',
      biologicalSex: '',
      height: '',
      weight: '',
      connectedDevice: null,
      specialty: '',
      medicalLicenseNumber: '',
      workplaceName: ''
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
      {/* Card */}
      <div className="bg-white dark:bg-gray-900 bg-opacity-30 dark:bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* User Type Selector */}
        {!userType && (
          <>
            <UserTypeSelector userType={userType} onUserTypeChange={handleChangeUserType} />
            
            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-200 dark:text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-yellow-300 hover:text-yellow-200 font-semibold underline">
                  Login here
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Patient Flow */}
        {userType === 'patient' && (
          <>
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

            {/* Step 5: Connect Wearable Device */}
            {step === 5 && (
              <Step5SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} isLoading={isLoading} />
            )}

            {/* Back to type selector button */}
            {step > 0 && (
              <button
                onClick={() => {
                  setUserType(null);
                  setStep(1);
                  setError('');
                }}
                className="mt-4 w-full text-center text-gray-100 dark:text-gray-300 text-sm hover:underline"
              >
                Back to account type
              </button>
            )}
            
            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-200 dark:text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-yellow-300 hover:text-yellow-200 font-semibold underline">
                  Login here
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Provider Flow */}
        {userType === 'provider' && (
          <>
            {/* Step 1: Email & Password */}
            {step === 1 && (
              <ProviderStep1SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} isLoading={isLoading} />
            )}

            {/* Step 2: Name */}
            {step === 2 && (
              <ProviderStep2SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} />
            )}

            {/* Step 3: Specialty */}
            {step === 3 && (
              <ProviderStep3SignUp formData={formData} handleChange={handleChange} handleNext={handleNext} isLoading={isLoading} />
            )}

            {/* Back to type selector button */}
            {step > 0 && (
              <button
                onClick={() => {
                  setUserType(null);
                  setStep(1);
                  setError('');
                }}
                className="mt-4 w-full text-center text-gray-100 dark:text-gray-300 text-sm hover:underline"
              >
                Back to account type
              </button>
            )}
            
            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-200 dark:text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-yellow-300 hover:text-yellow-200 font-semibold underline">
                  Login here
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
