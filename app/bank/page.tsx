import NavBar from '../components/nav-bar';
import MainContent from '../components/main-content';
import AiChat from '../components/ai-chat';

export default function BankPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <NavBar />
      <MainContent />
      <AiChat />
    </div>
  );
}
