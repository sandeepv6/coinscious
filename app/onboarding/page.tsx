'use client'

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Onboarding from '../components/onboarding';

export default function OnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOnboardingComplete = async (data: {
    firstName: string;
    lastName: string;
    age: number;
    interests: string[];
  }) => {
    if (!user) {
      setError('User authentication required');
      return;
    }

    setLoading(true);

    try {
      // Create user in Supabase with Clerk ID
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          age: data.age,
          interests: data.interests,
          email: user.primaryEmailAddress?.emailAddress || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user in database');
      }
      
      // Redirect to bank page after successful onboarding
      router.push('/bank');
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to save user data');
    } finally {
      setLoading(false);
    }
  };

  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, redirect to sign in
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome to MyBank</h1>
            <p className="text-gray-600 mt-2">Let's set up your account</p>
          </div>
          
          <Onboarding onComplete={handleOnboardingComplete} />
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          
          {loading && (
            <div className="mt-4 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-2">Setting up your account...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 