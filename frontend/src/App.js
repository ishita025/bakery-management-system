import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductList from './components/ProductList';
import OrderForm from './components/OrderForm';
import OrderStatus from './components/OrderStatus';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-pink-50 text-gray-800 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen p-6 flex flex-col justify-between">
          <div>
            <Link
              to="/"
              className="text-3xl font-bold text-pink-600 hover:text-pink-700 transition block mb-10"
            >
              🎂 Frosted Whimsy
            </Link>
            <nav>
              <ul className="flex flex-col gap-4 text-md font-medium text-gray-700">
                <li>
                  <Link to="/" className="hover:text-pink-600 transition">🍰 Products</Link>
                </li>
                <li>
                  <Link to="/order" className="hover:text-pink-600 transition">🛒 Place Order</Link>
                </li>
                <li>
                  <Link to="/status" className="hover:text-pink-600 transition">📦 Order Status</Link>
                </li>
              </ul>
            </nav>
          </div>

          <footer className="text-sm text-gray-500 pt-10">
            &copy; 2025 Frosted Whimsy
          </footer>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-10">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/status" element={<OrderStatus />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
