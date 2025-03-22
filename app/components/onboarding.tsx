'use client'

import { useState } from 'react';
import { X } from 'lucide-react';

type Interest = {
  id: string;
  name: string;
};

type OnboardingProps = {
  onComplete: (userData: {
    firstName: string;
    lastName: string;
    age: number;
    interests: string[];
  }) => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  const interests: Interest[] = [
    { id: 'investing', name: 'Investing' },
    { id: 'saving', name: 'Saving' },
    { id: 'retirement', name: 'Retirement Planning' },
    { id: 'budgeting', name: 'Budgeting' },
    { id: 'credit', name: 'Credit Building' },
    { id: 'homebuying', name: 'Home Buying' },
    { id: 'taxes', name: 'Tax Planning' },
    { id: 'education', name: 'Education Funding' },
    { id: 'insurance', name: 'Insurance' },
    { id: 'debt', name: 'Debt Management' },
  ];

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests([...selectedInterests, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleSubmit = () => {
    onComplete({
      firstName,
      lastName,
      age: typeof age === 'number' ? age : 0,
      interests: selectedInterests,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Progress bar */}
        <div className="bg-gray-100 rounded-t-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-800">Welcome to MyBank</h2>
            <span className="text-sm text-gray-500">Step {step} of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Let's get to know you</h3>
              <p className="text-gray-600">Please provide your basic information to get started.</p>
              
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">A bit more about you</h3>
              <p className="text-gray-600">This helps us personalize your banking experience.</p>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  min="18"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your age"
                  required
                />
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Your age helps us customize your personalized AI assistant.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">What are your financial interests?</h3>
              <p className="text-gray-600">Select all that apply to personalize your dashboard.</p>
              
              <div className="grid grid-cols-2 gap-2">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {interest.name}
                  </button>
                ))}
              </div>
              
              <div className="pt-2">
                <label htmlFor="customInterest" className="block text-sm font-medium text-gray-700 mb-1">
                  Add your own
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="customInterest"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value.toLowerCase())}
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter custom interest"
                  />
                  <button
                    type="button"
                    onClick={addCustomInterest}
                    className="bg-orange-500 text-white py-2 px-4 rounded-r-lg hover:bg-orange-600 transition-colors"
                    disabled={!customInterest.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {selectedInterests.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map((interest) => (
                      <div 
                        key={interest} 
                        className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {interest}
                        <button 
                          onClick={() => toggleInterest(interest)} 
                          className="ml-1 text-orange-500 hover:text-orange-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              disabled={step === 1 && (!firstName || !lastName) || (step === 2 && !age)}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              disabled={selectedInterests.length === 0}
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
