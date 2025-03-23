import React from 'react';

import NavBar from '../../components/nav-bar';
const InvestmentAdvice = () => {
  return (
    <> 
    <div className="flex-1 flex">
      <NavBar />
      <div className="p-8 bg-gradient-to-r from-green-100 to-blue-100 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Investment Advice</h1>
          <p className="text-lg text-gray-700 mb-8">Investing is a powerful tool for building wealth and securing your financial future. Whether you're new to investing or looking to diversify your portfolio, understanding the basics and exploring different investment options is crucial.</p>
          <p className="text-lg text-gray-700 mb-8">Start by assessing your financial goals and risk tolerance. Are you looking for short-term gains or long-term growth? Do you prefer low-risk investments or are you willing to take on more risk for potentially higher returns? Answering these questions can help you determine the best investment strategy for your needs.</p>
          <p className="text-lg text-gray-700 mb-8">Consider a mix of stocks, bonds, and real estate to diversify your portfolio and reduce risk. Stocks offer the potential for high returns but come with higher volatility. Bonds provide more stability and regular income, while real estate can offer long-term appreciation and rental income.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-green-200 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-green-700">Stocks & Bonds</h2>
              <p className="text-gray-800 mt-4">Learn about the stock market and bond investments to diversify your portfolio. Stocks represent ownership in a company and can offer high returns, while bonds are loans to a company or government and provide regular interest payments.</p>
            </div>
            <div className="bg-purple-200 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-purple-700">Real Estate</h2>
              <p className="text-gray-800 mt-4">Discover the benefits of investing in real estate for long-term growth. Real estate can provide rental income and potential appreciation, making it a valuable addition to your investment strategy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default InvestmentAdvice; 