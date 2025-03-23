'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ShoppingCart, Plus, Minus, X, CreditCard } from 'lucide-react';

// Define product type
type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
};

// Define cart item type
type CartItem = {
  product: Product;
  quantity: number;
};

export default function FakazonPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Wireless Earbuds",
      price: 49.99,
      description: "High-quality wireless earbuds with noise cancellation",
      image: "https://placehold.co/200x200/3b82f6/ffffff?text=Earbuds"
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 129.99,
      description: "Fitness tracker with heart rate monitoring",
      image: "https://placehold.co/200x200/3b82f6/ffffff?text=Watch"
    },
    {
      id: 3,
      name: "Portable Charger",
      price: 29.99,
      description: "10000mAh power bank for all your devices",
      image: "https://placehold.co/200x200/3b82f6/ffffff?text=Charger"
    },
    {
      id: 4,
      name: "Bluetooth Speaker",
      price: 79.99,
      description: "Waterproof speaker with 20-hour battery life",
      image: "https://placehold.co/200x200/3b82f6/ffffff?text=Speaker"
    }
  ]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const { userId } = useAuth();
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  
  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Increase quantity if already in cart
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    setMessage(`Added ${product.name} to cart`);
    setTimeout(() => setMessage(null), 2000);
  };
  
  // Update item quantity
  const updateQuantity = (productId: number, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with quantity 0
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };
  
  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage('Your cart is empty');
      return;
    }
    
    setIsCheckingOut(true);
    setMessage('Processing your order...');
    
    try {
      // Simulate API call to process transaction
      const response = await fetch('http://localhost:5000/api/simulate-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: cartTotal.toFixed(2),
          userId: userId,
          description: `Fakazon Purchase - ${cart.length} items`,
          merchant: 'Fakazon Inc.',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Transaction failed');
      }
      
      const data = await response.json();
      setMessage('Order successful! Redirecting to your bank...');
      
      // Clear cart
      setCart([]);
      
      // Redirect after successful transaction
      setTimeout(() => {
        router.push('/bank');
      }, 2000);
    } catch (error) {
      console.error('Error processing order:', error);
      setMessage('Order failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Fakazon</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={() => router.push('/bank')}
              className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
            >
              Return to Bank
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold mb-6">Featured Products</h2>
        
        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Shopping Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col">
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full hover:bg-blue-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <ul className="space-y-4">
                  {cart.map(item => (
                    <li key={item.product.id} className="flex items-center border-b pb-4">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-gray-600">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                          <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200 ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-bold">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <CreditCard size={20} />
                <span>{isCheckingOut ? 'Processing...' : 'Checkout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}