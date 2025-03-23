import React from 'react';
import NavBar from '../../components/nav-bar';

const FinancialGoalsPage = () => {
  return (
    <> 
    <div className="flex-1 flex">
      <NavBar />
      <div className="p-8 bg-gradient-to-r from-orange-100 to-yellow-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Financial Goals</h1>
        <p className="text-lg text-gray-700 mb-8">Setting financial goals is a crucial step towards achieving your dreams and securing your future. Whether you're saving for a house, planning a vacation, or building an emergency fund, having clear goals can guide your financial decisions and keep you motivated.</p>
        <p className="text-lg text-gray-700 mb-8">Start by identifying what you want to achieve in the short term and long term. Short-term goals might include saving for a new gadget or a weekend getaway, while long-term goals could involve buying a home or planning for retirement. It's important to set realistic and measurable goals, so you can track your progress and celebrate your achievements along the way.</p>
        <p className="text-lg text-gray-700 mb-8">Consider using budgeting tools and financial planning resources to help you stay on track. Regularly review your goals and adjust them as needed to reflect changes in your life or financial situation. Remember, the key to successful financial planning is consistency and adaptability.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-orange-200 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-orange-700">Short-Term Goals</h2>
            <p className="text-gray-800 mt-4">Plan for the next 1-2 years. Save for a vacation, a new gadget, or an emergency fund. These goals are typically easier to achieve and can provide quick wins to boost your confidence.</p>
          </div>
          <div className="bg-blue-200 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-blue-700">Long-Term Goals</h2>
            <p className="text-gray-800 mt-4">Think about the next 5-10 years. Save for a house, retirement, or your children's education. Long-term goals require more planning and discipline, but they are essential for building a secure future.</p>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
};

export default FinancialGoalsPage; 