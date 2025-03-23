'use client'

import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, ArrowRight, FileText, Bell, ChevronRight, Wallet, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

type AccountCardProps = {
  title: string;
  accountNumber: string;
  balance: string;
  type: 'debit' | 'credit' | 'savings';
};

type Transaction = {
  transaction_id: string;
  created_at: string;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  transaction_type: string;
  recipient?: string;
  note?: string;
  is_fraud?: boolean;
};

function AccountCard({ title, accountNumber, balance, type }: AccountCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'debit':
        return <DollarSign className="text-orange-500" size={24} />;
      case 'credit':
        return <CreditCard className="text-orange-500" size={24} />;
      case 'savings':
        return <Wallet className="text-orange-500" size={24} />;
      default:
        return <DollarSign className="text-orange-500" size={24} />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {getIcon()}
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Account Number</p>
        <p className="text-gray-700">{accountNumber}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">Available Balance</p>
        <p className="text-2xl font-bold text-gray-800">{balance}</p>
      </div>
      <button className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
        <span>View Details</span>
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatCardNumber(cardNumber: string): string {
  // Only show last 4 digits
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
}

export default function MainContent({ userData, walletData }: { userData: any, walletData: any }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData || !userData.user_id) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/transactions/${userData.user_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data);
        
        // Calculate income and expenses
        let totalIncome = 0;
        let totalExpenses = 0;
        
        data.forEach((transaction: Transaction) => {
          if (transaction.amount > 0) {
            totalIncome += transaction.amount;
          } else if (transaction.amount < 0) {
            totalExpenses += transaction.amount;
          }
        });
        
        setIncome(totalIncome);
        setExpenses(totalExpenses);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [userData]);

  // If wallet data is not available yet, show loading
  if (!walletData) {
    return (
      <div className="flex-1 p-8 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account data...</p>
        </div>
      </div>
    );
  }

  // Get card numbers for display
  const debitCard = walletData.payment_methods?.debit_cards?.[0] || { card_number: '0000' };
  const creditCard = walletData.payment_methods?.credit_cards?.[0] || { card_number: '0000' };
  
  return (
    <div className="flex-1 p-8 bg-gray-100 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {userData.first_name}</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <Bell size={20} className="text-gray-700" />
            </button>
            <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <FileText size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <AccountCard
            title="Checking Account"
            accountNumber={formatCardNumber(debitCard.card_number)}
            balance={formatCurrency(walletData.debit_balance)}
            type="debit"
          />
          <AccountCard
            title="Credit Card"
            accountNumber={formatCardNumber(creditCard.card_number)}
            balance={formatCurrency(walletData.credit_balance)}
            type="credit"
          />
          {walletData.saving_balance !== undefined && (
            <AccountCard
              title="Savings Account"
              accountNumber={formatCardNumber(debitCard.card_number)}
              balance={formatCurrency(walletData.saving_balance)}
              type="savings"
            />
          )}
        </div>

        {/* Income & Expenses */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Income & Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <ArrowRight className="text-green-600 transform rotate-225" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Income</p>
                  <p className="text-xl font-bold text-gray-800">
                    {loading ? 'Loading...' : formatCurrency(income)}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <ArrowRight className="text-red-600 transform rotate-45" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expenses</p>
                  <p className="text-xl font-bold text-gray-800">
                    {loading ? 'Loading...' : formatCurrency(expenses)}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-red-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            <Link href="/transactions" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No transactions found</div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.transaction_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      transaction.transaction_type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.category === 'food' && <Bell size={20} />}
                      {transaction.category === 'shopping' && <CreditCard size={20} />}
                      {transaction.category === 'transfer' && <ArrowRight size={20} />}
                      {!['food', 'shopping', 'transfer'].includes(transaction.category) && <DollarSign size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Health */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Health</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Shield className="text-blue-600" size={24} />
              </div>
              <p className="font-medium text-gray-800">Good</p>
              <p className="text-sm text-gray-500">Credit Score</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <p className="font-medium text-gray-800">2.5%</p>
              <p className="text-sm text-gray-500">Savings Rate</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <Clock className="text-purple-600" size={24} />
              </div>
              <p className="font-medium text-gray-800">2 Years</p>
              <p className="text-sm text-gray-500">Emergency Fund</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              View Financial Health Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
