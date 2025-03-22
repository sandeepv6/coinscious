import { CreditCard, DollarSign, ArrowRight, FileText, Bell } from 'lucide-react';

type AccountCardProps = {
  title: string;
  accountNumber: string;
  balance: string;
  type: 'debit' | 'credit';
};

function AccountCard({ title, accountNumber, balance, type }: AccountCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
            <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
              Transfer
            </button>
            <button className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
              Pay Bills
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              View Details
            </button>
          </>
        ) : (
          <>
            <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
              Pay Balance
            </button>
            <button className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
              View Statement
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              Manage Card
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MainContent() {
  return (
    <div className="flex-1 p-8 bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, Alex</h2>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
            <Bell size={20} className="text-gray-700" />
          </button>
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
            A
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
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
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Your Credit Cards</h3>
          <AccountCard 
            title="Platinum Rewards Card" 
            accountNumber="4111222233334444" 
            balance="1,240.78" 
            type="credit" 
          />
          <div className="bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg shadow-md p-6">
            <h3 className="text-white font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded flex justify-between items-center hover:bg-opacity-30">
                <span>View Recent Transactions</span>
                <ArrowRight size={16} />
              </button>
              <button className="w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded flex justify-between items-center hover:bg-opacity-30">
                <span>Set Up Automatic Payments</span>
                <ArrowRight size={16} />
              </button>
              <button className="w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded flex justify-between items-center hover:bg-opacity-30">
                <span>Apply for a Loan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
