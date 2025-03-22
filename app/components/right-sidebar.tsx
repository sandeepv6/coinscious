'use client'

import { useState, useEffect } from 'react';
import { User, CreditCard, TrendingUp, ArrowRight, Bell, Calendar } from 'lucide-react';

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

export default function RightSidebar({ userData, walletData }: RightSidebarProps) {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your bill payment of $120.45 was successful', time: '2 hours ago' },
    { id: 2, text: 'New statement is available for your credit card', time: '1 day ago' },
    { id: 3, text: 'Unusual activity detected on your account', time: '3 days ago' },
  ]);

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

    fetchUsers();
  }, [userData.user_id]);

  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a transaction
      const transaction = {
        user_id: userData.user_id,
        recipient_id: transferTo,
        amount: parseFloat(transferAmount),
        date: new Date().toISOString(),
        description: 'Quick Transfer',
        category: 'Transfer',
        payment_method: 'debit',
        transaction_type: 'debit',
      };

      console.log(transaction);

      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      alert(`Transfer of $${transferAmount} to user ID ${transferTo} initiated!`);
      setTransferAmount('');
      setTransferTo('');
    } catch (error) {
      console.error('Error during transfer:', error);
    }
  };

  return (
    <div className="w-80 p-4 mr-4 my-4 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
            {userData.first_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{userData.first_name} {userData.last_name}</h3>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="text-sm text-gray-500">First Name</div>
              <div className="text-sm font-medium border border-gray-200 rounded-lg p-2 bg-white">
                {userData.first_name}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-gray-500">Last Name</div>
              <div className="text-sm font-medium border border-gray-200 rounded-lg p-2 bg-white">
                {userData.last_name}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-gray-500">Email</div>
              <div className="text-sm font-medium border border-gray-200 rounded-lg p-2 bg-white">
                {userData.email}
              </div>
            </div>
          </div>
        </div>
        <button className="mt-3 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          View Profile
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
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Restaurants</span>
              <span className="text-sm font-bold text-orange-500">$342.55</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              15% higher than last month
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Shopping</span>
              <span className="text-sm font-bold text-green-500">$210.33</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              8% lower than last month
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Utilities</span>
              <span className="text-sm font-bold text-blue-500">$145.90</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Similar to last month
            </p>
          </div>
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
