import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getOrderStatus } from '../services/api';
import { toast } from 'react-toastify';

function OrderStatus() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialOrderId = queryParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialOrderId) {
      fetchOrderStatus(initialOrderId);
    }
  }, [initialOrderId]);

  const fetchOrderStatus = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderStatus(id);
      setOrderData(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to fetch order status';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId) {
      toast.error('Please enter an order ID');
      return;
    }
    fetchOrderStatus(orderId);
  };

  const statusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'processing':
        return 'bg-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-pink-600 mb-6">Check Your Order Status</h2>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 mb-8">
        <input
          type="number"
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full sm:w-auto flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400"
        />
        <button
          type="submit"
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg transition"
        >
          Check Status
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg text-center mb-6">
          {error}
        </div>
      )}

      {orderData && !loading && !error && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Order #{orderData.order_id}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadgeStyle(orderData.status)}`}>
              {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
            </span>
          </div>

          <p className="text-gray-600 mb-2">
            <strong>Customer:</strong> {orderData.customer_name}
          </p>
          <p className="text-gray-600 mb-6">
            <strong>Date:</strong> {new Date(orderData.created_at).toLocaleString()}
          </p>

          <table className="w-full text-left text-sm border-t border-gray-200">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider text-xs">
                <th className="py-2">Item</th>
                <th className="py-2">Price</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {orderData.items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2">₹{item.unit_price.toFixed(2)}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">₹{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t">
              <tr>
                <td colSpan="3" className="text-right font-semibold py-2">Grand Total:</td>
                <td className="font-semibold">₹{orderData.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrderStatus;
