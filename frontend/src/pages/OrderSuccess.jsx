import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref") || "";
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/ref/${reference}`)
      .then((res) => res.json())
      .then((data) => (data.error ? setError(data.error) : setOrder(data)))
      .catch(() => setError("Could not load your order"));
  }, [reference]);

  if (error) {
    return (
      <main className="container">
        <p className="form-error">{error}</p>
        <Link to="/" className="back-link">Back to shop</Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container">
        <p className="page-note">Loading...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <p className="form-success">Order placed successfully!</p>
      <h1>Thanks, {order.customerName}</h1>
      <p className="auth-hint">
        Your order reference is: <strong>{order.reference}</strong>
      </p>

      <h2>Items</h2>
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

      <p className="auth-hint">
        Shipping to {order.street}, {order.neighborhood} ({order.zipCode})
      </p>
      <p>
        <Link to="/" className="back-link">Back to shop</Link>
      </p>
    </main>
  );
}

export default OrderSuccess;