'use client'

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Search, Filter, Download, ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

type Transaction = {
  transaction_id: string;
  created_at: string;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  transaction_type?: string;
  recipient?: string;
  note?: string;
  is_fraud?: boolean;
};

type UserData = {
  user_id: string;
  clerk_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function TransactionsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleTransactions, setVisibleTransactions] = useState(10);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/check-user-by-clerk/${clerkUser.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        
        if (data.exists && data.user) {
          setUserData(data.user);
        } else {
          throw new Error('User not found in database');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data. Please try again later.');
      }
    };

    fetchUserData();
  }, [isLoaded, clerkUser]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData || !userData.user_id) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/transactions/${userData.user_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        // Determine transaction type based on amount sign
        const processedData = data.map((transaction: Transaction) => {
          // If amount is positive, it's income; if negative, it's expense
          const transactionType = transaction.amount >= 0 ? 'income' : 'expense';
          return { ...transaction, transaction_type: transactionType };
        });
        
        setTransactions(processedData);
        setFilteredTransactions(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transactions. Please try again later.');
        setLoading(false);
      }
    };

    if (userData) {
      fetchTransactions();
    }
  }, [userData]);

  useEffect(() => {
    let filtered = transactions;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.transaction_type === filterType);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(term) ||
        transaction.category.toLowerCase().includes(term) ||
        transaction.note?.toLowerCase().includes(term) ||
        transaction.amount.toString().includes(term)
      );
    }
    
    filtered = [...filtered].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' 
          ? a.amount - b.amount 
          : b.amount - a.amount;
      } else if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleLoadMore = () => {
    setVisibleTransactions(prev => prev + 10);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Note'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        formatDate(t.created_at),
        `"${t.description}"`,
        t.category,
        t.amount,
        t.transaction_type,
        `"${t.note || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="appearance-none bg-gray-100 py-2 px-4 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>
              
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No transactions match your search.' : 'No transactions found.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                          Date
                          {sortField === 'created_at' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {sortField === 'amount' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.slice(0, visibleTransactions).map((transaction) => (
                      <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          <div>{transaction.description}</div>
                          {transaction.note && (
                            <div className="text-xs text-gray-500 mt-1">{transaction.note}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {transaction.category}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.amount >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.amount >= 0 ? 'Income' : 'Expense'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredTransactions.length > visibleTransactions && (
                <div className="text-center py-4">
                  <button 
                    onClick={handleLoadMore}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Income</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                filteredTransactions
                  .filter(t => t.amount >= 0)
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(
                Math.abs(
                  filteredTransactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                )
              )}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Net Flow</h3>
            <p className={`text-2xl font-bold ${
              filteredTransactions.reduce((sum, t) => sum + t.amount, 0) >= 0
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
