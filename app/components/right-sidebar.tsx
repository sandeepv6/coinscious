'use client'

import { useState, useEffect } from 'react';
import { User, CreditCard, TrendingUp, ArrowRight, Bell, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

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
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your bill payment of $120.45 was successful', time: '2 hours ago' },
    { id: 2, text: 'New statement is available for your credit card', time: '1 day ago' },
    { id: 3, text: 'Unusual activity detected on your account', time: '3 days ago' },
  ]);

  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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
      insights[transaction.category] += Math.abs(transaction.amount);
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
    
    const amount = parseFloat(transferAmount);
    
    // 금액이 1,000원 이상인 경우 경고 모달 표시
    if (amount >= 1000) {
      const transaction = {
        user_id: userData.user_id,
        recipient_id: transferTo,
        amount: amount,
        description: 'Quick Transfer',
        category: 'transfer',
        payment_method: 'debit',
        note: `Transfer to user ${transferTo}`
      };
      
      setPendingTransaction(transaction);
      setShowWarningModal(true);
      return;
    }
    
    // 금액이 적은 경우 바로 이체 진행
    await executeTransfer({
      user_id: userData.user_id,
      recipient_id: transferTo,
      amount: amount,
      description: 'Quick Transfer',
      category: 'transfer',
      payment_method: 'debit',
      note: `Transfer to user ${transferTo}`
    });
  };

  const executeTransfer = async (transaction: any) => {
    try {
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

      alert(`Transfer of $${transaction.amount} to user ID ${transaction.recipient_id} successful!`);
      setTransferAmount('');
      setTransferTo('');
      
      // 모달 닫기
      setShowWarningModal(false);
      setPendingTransaction(null);
      
      // Optionally refresh the page or update the wallet balance
      window.location.reload();
    } catch (error) {
      console.error('Error during transfer:', error);
      alert(`Transfer failed: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      setShowWarningModal(false);
      setPendingTransaction(null);
    }
  };

  const handleConfirmTransfer = () => {
    if (pendingTransaction) {
      executeTransfer(pendingTransaction);
    }
  };

  const handleCancelTransfer = () => {
    setShowWarningModal(false);
    setPendingTransaction(null);
  };

  return (
    <div className="w-80 p-4 mr-4 my-4 space-y-6">
      {/* 경고 모달 */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-0">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto shadow-2xl animate-bounce-once relative overflow-hidden">
            {/* 상단 경고 바 */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500"></div>
            
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-100 flex items-center justify-center mr-3 sm:mr-4 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-9 sm:w-9 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Warning: High-Value Transfer</h3>
                <p className="text-xs sm:text-sm text-gray-500">Additional verification required</p>
              </div>
            </div>
            
            <div className="bg-red-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border-l-4 border-red-500">
              <p className="text-gray-800 mb-2 sm:mb-3 font-medium text-sm sm:text-base">
                You are attempting to transfer <span className="font-bold text-red-600 text-base sm:text-lg">${pendingTransaction?.amount.toLocaleString()}</span>, which is a high-value amount.
              </p>
              <p className="text-gray-700 text-xs sm:text-sm">
                • Please double-check that this amount is correct<br />
                • Verify that you trust the recipient of this transfer<br />
                • If you suspect fraud, cancel the transaction immediately
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-3">
              <button
                onClick={handleConfirmTransfer}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm sm:text-base"
              >
                Yes, Proceed
              </button>
              <button
                onClick={handleCancelTransfer}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-xl">
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

    </div>
  );
}
