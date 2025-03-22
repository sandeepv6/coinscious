import { CreditCard, DollarSign, ArrowRight, FileText, Bell, ChevronRight, Wallet, Clock, Shield } from 'lucide-react';

type AccountCardProps = {
  title: string;
  accountNumber: string;
  balance: string;
  type: 'debit' | 'credit';
};

function AccountCard({ title, accountNumber, balance, type }: AccountCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {type === 'debit' ? (
          <DollarSign className="text-orange-500" size={24} />
        ) : (
          <CreditCard className="text-orange-500" size={24} />
        )}
      </div>
      
      <p className="text-gray-500 text-sm mb-2">Account: •••• {accountNumber.slice(-4)}</p>
      <p className="text-2xl font-bold mb-4">${balance}</p>
      
      <div className="flex flex-wrap gap-2">
        {type === 'debit' ? (
          <>
            <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              Transfer
            </button>
            <button className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
              Pay Bills
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              View Details
            </button>
          </>
        ) : (
          <>
            <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              Pay Balance
            </button>
            <button className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
              View Statement
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Manage Card
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MainContent({ userData, walletData }: { userData: any, walletData: any }) {
  return (
    <div className="flex-1 p-8 bg-gray-100 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {userData.first_name}</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <Bell size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Account Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-xl font-bold text-gray-800">$17,630.45</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Income (This Month)</p>
              <p className="text-xl font-bold text-green-600">+$4,250.00</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Expenses (This Month)</p>
              <p className="text-xl font-bold text-red-600">-$2,180.35</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="text-sm text-orange-500 font-medium flex items-center hover:text-orange-600 transition-colors">
              View Detailed Report <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Accounts Section */}
        <h3 className="text-lg font-medium text-gray-700 mb-4">Your Accounts</h3>
        <AccountCard 
          title="Checking Account" 
          accountNumber="1234567890" 
          balance="5,280.45" 
          type="debit" 
        />
        
        <AccountCard 
          title="Savings Account" 
          accountNumber="0987654321" 
          balance="12,350.00" 
          type="debit" 
        />
        
        <h3 className="text-lg font-medium text-gray-700 mb-4 mt-8">Your Credit Cards</h3>
        <AccountCard 
          title="Platinum Rewards Card" 
          accountNumber="4111222233334444" 
          balance="1,240.78" 
          type="credit" 
        />
        
        {/* Financial Health */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Financial Health</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Shield className="text-green-600" size={24} />
              </div>
              <p className="font-medium text-gray-800">Good</p>
              <p className="text-sm text-gray-500">Credit Score</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Wallet className="text-blue-600" size={24} />
              </div>
              <p className="font-medium text-gray-800">15%</p>
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
