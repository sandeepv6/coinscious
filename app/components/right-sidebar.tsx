'use client'

import { useState, useEffect } from 'react';
import { User, CreditCard, TrendingUp, ArrowRight, Bell, Calendar } from 'lucide-react';
import { useRouter } from 'next/router';
import { useClerk } from '@clerk/clerk-react';

type RightSidebarProps = {
  userData: {
    first_name: string;
    last_name: string;
    email: string;
    user_id: string;
  };
  walletData: {
    debit_balance: number;
    credit_balance: number;
    payment_methods: {
      debit_cards: any[];
      credit_cards: any[];
    };
  };
};

type Transaction = {
  description: string;
  amount: number;
  category: string;
  created_at: string;
};

export default function RightSidebar({ userData, walletData }: RightSidebarProps) {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingInsights, setSpendingInsights] = useState<{ [key: string]: number }>({});
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your bill payment of $120.45 was successful', time: '2 hours ago' },
    { id: 2, text: 'New statement is available for your credit card', time: '1 day ago' },
    { id: 3, text: 'Unusual activity detected on your account', time: '3 days ago' },
  ]);

/*   const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }; */

  useEffect(() => {
    // Fetch all users from the database
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        const data = await response.json();
        setUsers(data.filter((user: any) => user.user_id !== userData.user_id)); // Exclude current user
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

   

    // Fetch transaction history
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/transactions/${userData.user_id}`);
        const data = await response.json();
        setTransactions(data);
        calculateSpendingInsights(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchUsers();
    fetchTransactions();
  }, [userData.user_id]);

  const calculateSpendingInsights = (transactions: Transaction[]) => {
    const insights: { [key: string]: number } = {};

    transactions.forEach((transaction) => {
      if (!insights[transaction.category]) {
        insights[transaction.category] = 0;
      }
      insights[transaction.category] += transaction.amount;
    });

    // Sort categories by total amount spent and select the top 5
    const sortedCategories = Object.entries(insights)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 5);

    // Convert back to an object
    const topInsights = Object.fromEntries(sortedCategories);

    setSpendingInsights(topInsights);
  };

  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferTo || !transferAmount) {
      alert("Please select a recipient and enter an amount");
      return;
    }
    
    try {
      console.log("Selected recipient ID:", transferTo);
      console.log("Transfer amount:", transferAmount);
      
      // Create a transaction
      const transaction = {
        user_id: userData.user_id,
        recipient_id: transferTo,
        amount: parseFloat(transferAmount),
        description: 'Quick Transfer',
        category: 'transfer',
        payment_method: 'debit',
        note: `Transfer to user ${transferTo}`
      };

      console.log("Sending transaction data:", transaction);

      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      alert(`Transfer of $${transferAmount} to user ID ${transferTo} successful!`);
      setTransferAmount('');
      setTransferTo('');
      
      // Optionally refresh the page or update the wallet balance
      window.location.reload();
    } catch (error) {
      console.error('Error during transfer:', error);
      alert(`Transfer failed: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  };

  const handleSignOut = () => {
    // Implement sign out logic
    console.log("Signing out");
  };

  return (
    <div className="w-80 p-4 mr-4 my-4 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gradient-to-r from-orange-500 to-yellow-500 to-yellow-500 flex items-center justify-center text-white font-bold text-xl">
            {userData.first_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800 text-lg">{userData.first_name} {userData.last_name}</h3>
            <div className="flex items-center">
              <p className="text-sm text-gray-500 mr-2">{userData.email}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">First Name</div>
              <div className="text-sm font-medium text-gray-800">{userData.first_name}</div>
            </div>
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">Last Name</div>
              <div className="text-sm font-medium text-gray-800">{userData.last_name}</div>
            </div>
            <div className="flex flex-col col-span-2">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium text-gray-800">{userData.email}</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-4 w-full py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
        >
          <span className="sr-only">Sign Out</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v13.5A2.25 2.25 0 004.5 21h9a2.25 2.25 0 002.25-2.25V15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12h-15m0 0l3-3m-3 3l3 3" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* Quick Transfer Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <ArrowRight size={18} className="mr-2 text-orange-500" />
          Quick Transfer
        </h3>
        <form onSubmit={handleQuickTransfer}>
          <div className="mb-3">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="pl-8 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <select
              id="to"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Select recipient</option>
              {users.map((user: any) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            disabled={!transferAmount || !transferTo}
          >
            Transfer Now
          </button>
        </form>
      </div>

      {/* Spending Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp size={18} className="mr-2 text-orange-500" />
          Spending Insights
        </h3>
        <div className="space-y-3">
          {Object.entries(spendingInsights).map(([category, amount]) => (
            <div key={category} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{category}</span>
                <span className="text-sm font-bold text-orange-500">${amount.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((amount / 1000) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {/* Placeholder for comparison with last month */}
                Compared to last month
              </p>
            </div>
          ))}
        </div>
        <button className="mt-3 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          View Full Report
        </button>
      </div>

      {/* Upcoming Payments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Calendar size={18} className="mr-2 text-orange-500" />
          Upcoming Payments
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                <CreditCard size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Credit Card</p>
                <p className="text-xs text-gray-500">Due in 3 days</p>
              </div>
            </div>
            <span className="font-medium text-blue-600">$240.00</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 mr-3">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Netflix</p>
                <p className="text-xs text-gray-500">Due in 10 days</p>
              </div>
            </div>
            <span className="font-medium text-green-600">$14.99</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 mr-3">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Phone Bill</p>
                <p className="text-xs text-gray-500">Due in 14 days</p>
              </div>
            </div>
            <span className="font-medium text-purple-600">$85.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
