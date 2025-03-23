'use client'

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import NavBar from '../components/nav-bar';
import MainContent from '../components/main-content';
import RightSidebar from '../components/right-sidebar';
import AiChat from '../components/ai-chat';

type PaymentMethod = {
  card_number: string;
  expiry_date: string;
  cvv: string;
  card_type: string;
  card_name: string;
  credit_limit?: number;
};

type Wallet = {
  wallet_id: string;
  user_id: string;
  debit_balance: number;
  credit_balance: number;
  payment_methods: {
    debit_cards: PaymentMethod[];
    credit_cards: PaymentMethod[];
  };
  created_at: string;
};

type UserData = {
  user_id: string;
  clerk_id: string;
  first_name: string;
  last_name: string;
  age: number;
  interests: string[];
  email: string;
  created_at: string;
};

type ApiResponse = {
  exists: boolean;
  user?: UserData;
  wallet?: Wallet;
};

export default function BankPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [walletData, setWalletData] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if Clerk user is loaded
    if (!isUserLoaded || !user) {
      setLoading(false);
      return;
    }

    const checkUserInDatabase = async () => {
      try {
        // Check if user exists in Supabase by Clerk ID
        const response = await fetch(`http://localhost:5000/api/check-user-by-clerk/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to check user in database');
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.exists && data.user) {
          // User exists in database, set user data
          setUserData(data.user);
          if (data.wallet) {
            setWalletData(data.wallet);
          }
        } else {
          // User doesn't exist in database, redirect to onboarding
          router.push('/onboarding');
          return;
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setError('Failed to verify user data');
      } finally {
        setLoading(false);
      }
    };

    checkUserInDatabase();
  }, [isUserLoaded, user, router]);

  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, redirect or show login prompt
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your banking dashboard.</p>
          <a 
            href="/sign-in" 
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your banking dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData || !walletData) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Setup Required</h2>
          <p className="text-gray-600 mb-6">Please complete your account setup to access the banking dashboard.</p>
          <a 
            href="/onboarding" 
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Complete Setup
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <NavBar />
      <div className="flex-1 flex">
        <MainContent userData={userData} walletData={walletData} />
        <RightSidebar userData={userData} walletData={walletData} />
      </div>
      <AiChat userID={userData?.user_id} />
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
