'use client';

import { useState, useRef } from 'react';
import { getPasswordValidation, getPasswordRulesDisplay } from '@/utils/passwordValidation';

export default function PasswordInput({ 
  value, 
  onChange, 
  placeholder = 'Enter your password',
  label = 'Password',
  disabled = false,
  showValidation = true,
  required = false,
  className = '',
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const validation = getPasswordValidation(value);
  const rules = getPasswordRulesDisplay();

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    }
    setShowTooltip(true);
  };

  const InfoIcon = () => (
    <svg 
      className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-help transition-colors"
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );

  const CheckIcon = ({ isValid }) => (
    <svg 
      className={`w-4 h-4 ${isValid ? 'text-green-500' : 'text-gray-300'}`}
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  const EyeOpenIcon = () => (
    <svg 
      className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );

  const EyeClosedIcon = () => (
    <svg 
      className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M1 1l22 22" />
    </svg>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div>
          <button
            ref={buttonRef}
            type="button"
            tabIndex={-1}
            className="p-1 rounded hover:bg-blue-50 transition-colors"
            title="Password requirements"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <InfoIcon />
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="fixed w-80 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-600 rounded-lg shadow-2xl z-[9999] p-4 pointer-events-auto"
          style={{
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="space-y-3">
            {rules.map((ruleItem) => (
              <div key={ruleItem.key} className="flex items-start gap-2">
                <CheckIcon isValid={validation[ruleItem.key]} />
                <span className={`text-sm ${validation[ruleItem.key] ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {ruleItem.rule}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 pr-10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 ${className}`}
          required={required}
        />
        
        {/* Password visibility toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      </div>

      {/* Inline Validation Display */}
      {showValidation && value.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-2">
            {rules.map((ruleItem) => (
              <div key={ruleItem.key} className="flex items-center gap-2">
                <CheckIcon isValid={validation[ruleItem.key]} />
                <span className={`text-xs ${validation[ruleItem.key] ? 'text-gray-700' : 'text-gray-500'}`}>
                  {ruleItem.rule}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
