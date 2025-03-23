import NavBar from '@/app/components/nav-bar';
import React from 'react';

const RetirementPlanning = () => {
  return (
    <>
    <div className="flex-1 flex">
      <NavBar />
    <div className="p-8 bg-gradient-to-r from-yellow-100 to-orange-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Retirement Planning</h1>
        <p className="text-lg text-gray-700 mb-8">Planning for retirement is a crucial step in ensuring a secure and comfortable future. It's never too early to start thinking about how you'll support yourself in your later years.</p>
        <p className="text-lg text-gray-700 mb-8">Begin by estimating your retirement needs. Consider your desired lifestyle, potential healthcare costs, and any other expenses you might incur. This will help you set realistic savings goals.</p>
        <p className="text-lg text-gray-700 mb-8">Explore different retirement savings options, such as 401(k) plans, IRAs, and pension plans. Each has its own benefits and limitations, so it's important to understand how they fit into your overall retirement strategy.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-yellow-200 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-yellow-700">Pension Plans</h2>
            <p className="text-gray-800 mt-4">Understand different pension plans and choose the best option for your retirement. Pension plans provide a steady income stream, making them a reliable choice for many retirees.</p>
          </div>
          <div className="bg-red-200 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-700">Savings & Investments</h2>
            <p className="text-gray-800 mt-4">Learn how to save and invest wisely to ensure a steady income during retirement. Diversifying your investments can help protect your savings from market fluctuations.</p>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
};

export default RetirementPlanning; 