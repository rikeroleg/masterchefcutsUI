import React from 'react'
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Beef, ShoppingCart, Home, Info, Phone } from "lucide-react";
import './App.css'
import CowDiagram from './Components/shop/CowDiagram';

function App() {

  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to={createPageUrl("Home")} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg">
                <Beef className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-red-800">Prime Cuts</h1>
                <p className="text-sm text-red-600">Premium Butcher Shop</p>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-8">
              <Link 
                to={createPageUrl("Home")} 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === createPageUrl("Home") 
                    ? 'bg-red-100 text-red-800 font-semibold' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Shop</span>
              </Link>
              <Link 
                to={createPageUrl("Cart")} 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === createPageUrl("Cart") 
                    ? 'bg-red-100 text-red-800 font-semibold' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
              </Link>
              <Link 
                to={createPageUrl("About")} 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === createPageUrl("About") 
                    ? 'bg-red-100 text-red-800 font-semibold' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <Info className="w-5 h-5" />
                <span>About</span>
              </Link>
            </nav>
          </div>
        </div> 0
      </header>

      {/* Fullscreen Main Cow */}
      <main className="flex-1 p-0">
        <CowDiagram />
      </main>

      {/* Footer */}
      <footer className="bg-red-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Beef className="w-8 h-8" />
                <h3 className="text-xl font-bold">Prime Cuts</h3>
              </div>
              <p className="text-red-200">
                Premium quality meats from local farms. 
                Fresh cuts delivered daily since 1952.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-red-200">
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>(555) 123-MEAT</span>
                </p>
                <p>123 Butcher Lane</p>
                <p>Meattown, MT 12345</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Hours</h4>
              <div className="space-y-1 text-red-200 text-sm">
                <p>Monday - Friday: 8AM - 7PM</p>
                <p>Saturday: 8AM - 6PM</p>
                <p>Sunday: 10AM - 4PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-red-700 mt-8 pt-6 text-center text-red-300">
            <p>&copy; 2024 Prime Cuts Butcher Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

