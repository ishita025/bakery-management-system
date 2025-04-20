import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, placeOrder } from '../services/api';
import { toast } from 'react-toastify';

function OrderForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    items: []
  });

  const [selectedItems, setSelectedItems] = useState([]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (e) => {
    const productId = parseInt(e.target.value);
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product && !selectedItems.find(item => item.product_id === productId)) {
        setSelectedItems([...selectedItems, {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }]);
      }
    }
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...selectedItems];
    newItems[index].quantity = parseInt(value);
    setSelectedItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    try {
      const orderData = {
        ...formData,
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const response = await placeOrder(orderData);
      toast.success('Order placed successfully!');
      navigate(`/status?orderId=${response.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (error) {
    return <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg text-center max-w-lg mx-auto mt-8">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-pink-600 text-center mb-6">Place Your Order</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customer_name" className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>
          <div>
            <label htmlFor="customer_email" className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              id="customer_email"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Add Product</label>
          <select
            onChange={handleProductSelect}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400"
            defaultValue=""
          >
            <option disabled value="">Select a product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} - ₹{product.price.toFixed(2)} ({product.stock} in stock)
              </option>
            ))}
          </select>
        </div>

        {selectedItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Selected Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">₹{item.price.toFixed(2)}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-20 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-3">₹{(item.price * item.quantity).toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan="3" className="p-3 text-right">Total:</td>
                    <td className="p-3">₹{calculateTotal().toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="text-right">
          <button
            type="submit"
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg transition"
          >
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;
