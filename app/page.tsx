import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-orange-500 mb-6">Welcome to MyBank</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Experience our new online banking platform with enhanced features and security.
      </p>
      <Link 
        href="/bank" 
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Go to Online Banking
      </Link>
    </div>
  );
}
