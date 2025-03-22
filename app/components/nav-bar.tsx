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
    <nav className="h-screen w-64 bg-gray-100 p-4 ml-4 my-4 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">MyBank</h1>
      </div>
      <div className="py-4">
        <Link href="/bank" className="block px-4 py-2 text-orange-600 font-medium hover:bg-orange-50 rounded">
          Dashboard
        </Link>
        
        {sections.map((section, index) => (
          <div key={section.title} className="mt-4">
            <button 
              onClick={() => toggleSection(index)}
              className="w-full flex justify-between items-center px-4 py-2 text-gray-800 font-semibold hover:bg-orange-50 rounded"
            >
              <span>{section.title}</span>
              <span>{section.isOpen ? '−' : '+'}</span>
            </button>
            
            {section.isOpen && (
              <div className="mt-1 space-y-1">
                {section.items.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.path}
                    className="block px-8 py-2 text-sm text-gray-600 hover:bg-orange-100 hover:text-orange-700 rounded-md"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
