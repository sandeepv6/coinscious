'use client'
import NavBar from '../components/nav-bar';
import MainContent from '../components/main-content';
import RightSidebar from '../components/right-sidebar';
import AiChat from '../components/ai-chat';
import { useEffect, useState } from 'react';

export default function BankPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <NavBar />
      <div className="flex-1 flex">
        <MainContent />
        <RightSidebar />
      </div>
      <AiChat />
      <div>
        <h1>Data from Backend</h1>
        <ul>
          {data.map((item: any) => (
            <li key={item.user_id}>{item.first_name} {item.last_name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
