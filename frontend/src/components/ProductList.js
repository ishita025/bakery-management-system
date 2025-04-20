import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import { Link } from 'react-router-dom';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.products);
        setLoading(false);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg max-w-xl mx-auto text-center mt-8">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-center text-pink-600 mb-10">
        🍪 Our Delicious Treats
      </h2>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow-md hover:shadow-xl rounded-2xl p-6 transition flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-semibold text-teal-700 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{product.description}</p>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-800">
                ₹{product.price.toFixed(2)}
              </span>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium 
                  ${product.stock > 10
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-800'}`}
              >
                {product.stock} in stock
              </span>
            </div>

            <Link
              to="/order"
              className="bg-pink-500 hover:bg-pink-600 text-white text-center py-2 rounded-md transition mt-auto"
            >
              Order Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
