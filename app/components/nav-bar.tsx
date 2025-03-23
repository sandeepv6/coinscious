'use client'
import Link from 'next/link';
import { useState } from 'react';

type NavSection = {
  title: string;
  items: { name: string; path: string }[];
  isOpen: boolean;
};

export default function NavBar() {
  const [sections, setSections] = useState<NavSection[]>([
    {
      title: "Move Money",
      isOpen: true,
      items: [
        { name: "Pay Bills", path: "/bank/pay-bills" },
        { name: "Transfer Funds", path: "/bank/transfer" },
        { name: "Pay Credit Card", path: "/bank/pay-credit" },
        { name: "Send Money", path: "/bank/send-money" }
      ]
    },
    {
      title: "Documents",
      isOpen: true,
      items: [
        { name: "Statements", path: "/bank/statements" },
        { name: "Reports", path: "/bank/reports" },
        { name: "Tax Documents", path: "/bank/tax-docs" },
        { name: "Download History", path: "/bank/downloads" }
      ]
    },
    {
      title: "Advice & Planning",
      isOpen: true,
      items: [
        { name: "Financial Goals", path: "/bank/goals" },
        { name: "Investment Advice", path: "/bank/investments" },
        { name: "Retirement Planning", path: "/bank/retirement" },
        { name: "Budget Tools", path: "/bank/budget" }
      ]
    }
  ]);

  const toggleSection = (index: number) => {
    setSections(sections.map((section, i) => 
      i === index ? { ...section, isOpen: !section.isOpen } : section
    ));
  };

  return (
    <nav className="h-screen w-72 bg-gray-100 p-4 ml-4 my-4 rounded-xl shadow-sm">
      <div className="p-4 mb-4 bg-gray-800 rounded-lg shadow-md">
        <Link href="/bank" className="flex items-center">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" />
          <h1 className="text-2xl font-bold text-white">Coinscious</h1>
        </Link>
      </div>
      
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.title} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection(index)}
              className="w-full flex justify-between items-center px-4 py-3 text-gray-800 font-semibold hover:bg-orange-50 transition-colors"
            >
              <span>{section.title}</span>
              <span className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center">
                {section.isOpen ? '−' : '+'}
              </span>
            </button>
            
            {section.isOpen && (
              <div className="bg-gray-50 rounded-b-lg">
                {section.items.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.path}
                    className="block px-6 py-2 text-sm text-gray-600 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg text-white shadow-md">
        <h3 className="font-medium mb-2">Need Help?</h3>
        <p className="text-sm mb-3">Contact our customer support team for assistance with your banking needs.</p>
        <button className="bg-white text-orange-500 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
          Contact Support
        </button>
      </div>
    </nav>
  );
}
