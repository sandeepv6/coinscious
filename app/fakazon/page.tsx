'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, User, Heart, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

// Types
type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  description: string;
};

type CartItem = Product & {
  quantity: number;
};

type User = {
  username: string;
  password: string;
};

// Mock data
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Wireless Noise Cancelling Headphones",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
    rating: 4.5,
    reviews: 1287,
    description: "Premium wireless headphones with industry-leading noise cancellation, exceptional sound quality, and up to 30 hours of battery life."
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 199.95,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHByb2R1Y3R8ZW58MHx8MHx8fDA%3D",
    rating: 4.3,
    reviews: 945,
    description: "Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, sleep tracking, and 7-day battery life."
  },
  {
    id: 3,
    name: "Ultra HD 4K Smart TV - 55\"",
    price: 699.99,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
    rating: 4.7,
    reviews: 2103,
    description: "Experience stunning picture quality with this 55-inch 4K Ultra HD Smart TV featuring HDR, built-in streaming apps, and voice control."
  },
  {
    id: 4,
    name: "Professional Blender",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHByb2R1Y3R8ZW58MHx8MHx8fDA%3D",
    rating: 4.4,
    reviews: 876,
    description: "High-performance blender with variable speed control, pulse feature, and hardened stainless-steel blades for smooth blending."
  },
  {
    id: 5,
    name: "Ergonomic Office Chair",
    price: 249.00,
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHByb2R1Y3R8ZW58MHx8MHx8fDA%3D",
    rating: 4.2,
    reviews: 543,
    description: "Comfortable ergonomic office chair with adjustable lumbar support, height adjustment, and breathable mesh back for all-day comfort."
  },
  {
    id: 6,
    name: "Portable Bluetooth Speaker",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2R1Y3R8ZW58MHx8MHx8fDA%3D",
    rating: 4.6,
    reviews: 1532,
    description: "Waterproof portable Bluetooth speaker with 360° sound, 24-hour battery life, and durable design for indoor and outdoor use."
  }
];

// Mock user database
const USERS: User[] = [
  { username: "user1", password: "password1" },
  { username: "user2", password: "password2" },
  { username: "demo", password: "demo123" }
];

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-yellow-400"
              : star - 0.5 <= rating
              ? "text-yellow-400 fill-yellow-400 half"
              : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating})</span>
    </div>
  );
}

export default function FakazonPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);

  // Filter products based on search query
  const filteredProducts = PRODUCTS.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add to cart function
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove from cart function
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Update quantity function
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = USERS.find(
      user => user.username === username && user.password === password
    );
    
    if (user) {
      setIsLoggedIn(true);
      setLoginError("");
      setIsLoginOpen(false);
      
      if (isCheckoutOpen) {
        // Simulate order processing
        setTimeout(() => {
          setOrderComplete(true);
          setCart([]);
        }, 1500);
      }
    } else {
      setLoginError("Invalid username or password");
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (isLoggedIn) {
      setIsCheckoutOpen(true);
      setIsCartOpen(false);
      
      // Simulate order processing
      setTimeout(() => {
        setOrderComplete(true);
        setCart([]);
      }, 1500);
    } else {
      setIsLoginOpen(true);
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/fakazon" className="text-2xl font-bold text-orange-400">
                Fakazon
              </Link>
              <div className="ml-6 hidden md:block">
                <button className="flex items-center space-x-1 text-gray-300 hover:text-white">
                  <Menu size={18} />
                  <span>All</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 mx-6 hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Fakazon"
                  className="w-full py-2 px-4 rounded-md text-gray-800 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-0 top-0 h-full px-4 bg-orange-400 rounded-r-md flex items-center justify-center">
                  <Search size={20} className="text-gray-800" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => isLoggedIn ? handleLogout() : setIsLoginOpen(true)}
                  className="flex flex-col items-center text-sm hover:text-orange-300"
                >
                  <User size={20} />
                  <span>{isLoggedIn ? `Hi, ${username}` : "Sign In"}</span>
                </button>
              </div>
              
              <button className="hidden md:flex flex-col items-center text-sm hover:text-orange-300">
                <Heart size={20} />
                <span>Wishlist</span>
              </button>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center text-sm hover:text-orange-300 relative"
              >
                <ShoppingCart size={20} />
                <span>Cart</span>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Fakazon"
                className="w-full py-2 px-4 rounded-md text-gray-800 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-orange-400 rounded-r-md flex items-center justify-center">
                <Search size={20} className="text-gray-800" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-gray-800 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 overflow-x-auto text-sm whitespace-nowrap pb-1">
            <a href="#" className="hover:text-orange-300">Today's Deals</a>
            <a href="#" className="hover:text-orange-300">Customer Service</a>
            <a href="#" className="hover:text-orange-300">Registry</a>
            <a href="#" className="hover:text-orange-300">Gift Cards</a>
            <a href="#" className="hover:text-orange-300">Sell</a>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-8 p-6 md:p-10 text-white">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Welcome to Fakazon</h1>
          <p className="text-lg md:text-xl mb-4">Shop our amazing deals today!</p>
          <button className="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold py-2 px-6 rounded">
            Shop Now
          </button>
        </div>
        
        {/* Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No products found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <div className="flex items-center mb-2">
                      <StarRating rating={product.rating} />
                      <span className="ml-2 text-sm text-gray-500">{product.reviews} reviews</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-orange-400 hover:bg-orange-500 text-white py-1 px-4 rounded flex items-center"
                      >
                        <ShoppingCart size={16} className="mr-1" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="ml-3 h-7 flex items-center"
                    >
                      <X size={24} className="text-gray-400 hover:text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="mt-8">
                    {cart.length === 0 ? (
                      <div className="text-center py-10">
                        <ShoppingCart size={64} className="mx-auto text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                        <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart</p>
                        <div className="mt-6">
                          <button
                            onClick={() => setIsCartOpen(false)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500"
                          >
                            Continue Shopping
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flow-root">
                        <ul className="-my-6 divide-y divide-gray-200">
                          {cart.map((item) => (
                            <li key={item.id} className="py-6 flex">
                              <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="ml-4 flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>{item.name}</h3>
                                    <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="flex-1 flex items-end justify-between text-sm">
                                  <div className="flex items-center border rounded">
                                    <button 
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                    >
                                      -
                                    </button>
                                    <span className="px-2">{item.quantity}</span>
                                    <button 
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                    >
                                      +
                                    </button>
                                  </div>
                                  
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="font-medium text-orange-600 hover:text-orange-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {cart.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                    <div className="mt-6">
                      <button
                        onClick={proceedToCheckout}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-400 hover:bg-orange-500"
                      >
                        Checkout
                      </button>
                    </div>
                    <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                      <p>
                        or{' '}
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="text-orange-600 font-medium hover:text-orange-500"
                        >
                          Continue Shopping<span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => !isCheckoutOpen && setIsLoginOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Sign In</h3>
                    <div className="mt-2">
                      <form onSubmit={handleLogin} className="space-y-4">
                        {loginError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {loginError}
                          </div>
                        )}
                        
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Demo accounts: user1/password1, user2/password2, or demo/demo123
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="remember-me"
                              name="remember-me"
                              type="checkbox"
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                              Remember me
                            </label>
                          </div>
                          
                          <div className="text-sm">
                            <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                              Forgot your password?
                            </a>
                          </div>
                        </div>
                        
                        <div>
                          <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            Sign in
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {!isCheckoutOpen && (
                  <button
                    onClick={() => setIsLoginOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Complete Modal */}
      {orderComplete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Order Complete!
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Thank you for your purchase! Your order has been successfully placed and will be processed shortly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-400 text-base font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setOrderComplete(false);
                    setIsCheckoutOpen(false);
                  }}
                >
                  Continue Shopping
                </button>
                <Link
                  href="/bank"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Return to Banking
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Get to Know Us</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">About Fakazon</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Investor Relations</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Fakazon Devices</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Make Money with Us</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Sell products on Fakazon</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Sell on Fakazon Business</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Become an Affiliate</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Advertise Your Products</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Products</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Fakazon Business Card</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Shop with Points</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Reload Your Balance</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Fakazon Currency Converter</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Let Us Help You</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Your Account</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Your Orders</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Shipping Rates & Policies</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Returns & Replacements</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Help</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} Fakazon.com, Inc. or its affiliates. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Terms of Use
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Legal
              </a>
              <Link href="/" className="text-gray-400 hover:text-white">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}