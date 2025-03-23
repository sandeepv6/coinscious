'use client'

import { useState, useEffect } from 'react';
import { PieChart, DollarSign, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

type Budget = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly';
  start_date: string;
  end_date: string;
};

type BudgetCardProps = {
  title: string;
  className?: string;
};

export default function BudgetCard({ title }: BudgetCardProps) {
  const { user, isLoaded } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    start_date: '',
    end_date: ''
  });
  
  // Fetch budgets for the user
  useEffect(() => {
    if (isLoaded && user) {
      const fetchBudgets = async () => {
        try {
          // Use the clerk ID directly instead of fetching from an API
          const clerkId = user.id;
          
          // Make a direct request to your Flask backend
          const response = await fetch(`http://localhost:5000/api/budgets/by-clerk/${clerkId}`);
          const data = await response.json();
          
          if (response.ok) {
            setBudgets(data);
            // Calculate total budget
            const total = data.reduce((sum: number, budget: Budget) => sum + Number(budget.amount), 0);
            setTotalBudget(total);
          }
        } catch (error) {
          console.error('Error fetching budgets:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchBudgets();
    }
  }, [isLoaded, user]);
  
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const userData = await fetch(`http://localhost:5000/api/check-user-by-clerk/${user.id}`).then(res => res.json());
      
      if (!userData.exists) return;
      
      const budgetData = {
        user_id: userData.user.user_id,
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };
      
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budgetData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add the new budget to state
        setBudgets([...budgets, result.budget]);
        setTotalBudget(totalBudget + parseFloat(formData.amount));
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };
  
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBudget) return;
    
    try {
      const budgetData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };
      
      const response = await fetch(`http://localhost:5000/api/budgets/${selectedBudget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budgetData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Calculate difference for total budget
        const oldAmount = selectedBudget.amount;
        const newAmount = parseFloat(formData.amount);
        setTotalBudget(totalBudget - oldAmount + newAmount);
        
        // Update budget in state
        setBudgets(budgets.map(budget => 
          budget.id === selectedBudget.id ? result.budget : budget
        ));
        setShowEditModal(false);
        setSelectedBudget(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };
  
  const handleDeleteBudget = async (id: string, amount: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/budgets/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove budget from state
        setBudgets(budgets.filter(budget => budget.id !== id));
        setTotalBudget(totalBudget - amount);
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };
  
  const editBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      start_date: new Date(budget.start_date).toISOString().split('T')[0],
      end_date: new Date(budget.end_date).toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };
  
  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
      start_date: '',
      end_date: ''
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <PieChart className="text-orange-500" size={24} />
      </div>
      
      {loading ? (
        <div className="py-2 text-gray-500">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div>
          <p className="text-sm text-gray-500 mb-1">No budget plans found</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(0)}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Allocated</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalBudget)}</p>
          <p className="text-sm text-gray-500 mt-2">Active Budgets: {budgets.length}</p>
        </div>
      )}
      
      <button 
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
      >
        <span>{budgets.length > 0 ? 'Manage Budgets' : 'Create Budget'}</span>
        <ChevronRight size={16} className="ml-1" />
      </button>
      
      {/* Create Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Budget</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateBudget}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., Groceries, Entertainment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Manage Budgets Modal */}
      {showModal && budgets.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Budgets</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {budgets.map(budget => (
                <div key={budget.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{budget.category}</span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => editBudget(budget)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBudget(budget.id, budget.amount)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{budget.period === 'monthly' ? 'Monthly' : 'Weekly'}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(budget.amount)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="w-full py-2 bg-orange-100 text-orange-800 rounded font-medium hover:bg-orange-200 transition-colors flex items-center justify-center"
            >
              <Plus size={16} className="mr-1" />
              <span>Add New Budget</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Budget Modal */}
      {showEditModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Budget</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateBudget}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Update Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 