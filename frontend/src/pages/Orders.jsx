import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Orders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders/mine")
      .then((res) => res.json())
      .then(setOrders);
  }, [user]);

  if (loading) return <p className="page-note">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (orders === null) return <p className="page-note">Loading...</p>;

  if (orders.length === 0) {
    return (
      <main className="container">
        <h1>Order history</h1>
        <p className="page-note">No orders yet.</p>
        <Link to="/" className="back-link">Start shopping</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Order history</h1>
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-top">
            <strong>{order.reference}</strong>
            <span className={`status status-${order.status}`}>
              {order.statusLabel}
            </span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          {order.items.map((item) => (
            <div key={item.id} className="summary-line">
              <span>
                {item.quantity} &times; {item.productName}
              </span>
              <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total</strong>
            <strong>${Number(order.total).toFixed(2)}</strong>
          </div>
        </div>
      ))}
    </main>
  );
}

export default Orders;