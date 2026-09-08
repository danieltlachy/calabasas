import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    street: "",
    neighborhood: "",
    zipCode: "",
    landmarks: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState("");

  useEffect(() => {
    if (!user) return;
    async function prefillPrimaryAddress() {
      const res = await fetch("/api/users/me/addresses");
      if (!res.ok) return;
      const addresses = await res.json();
      const primary = addresses.find((a) => a.isPrimary) || addresses[0];
      if (!primary) return;
      setCustomer((c) => ({
        ...c,
        street: primary.street,
        neighborhood: primary.neighborhood,
        zipCode: primary.zipCode,
        landmarks: primary.landmarks || "",
      }));
    }
    prefillPrimaryAddress();
    fetch("/api/users/me/payment-methods")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMethods);
  }, [user]);

  if (items.length === 0) {
    return (
      <main className="container">
        <h1>Checkout</h1>
        <p className="page-note">Your cart is empty.</p>
        <Link to="/" className="back-link">Continue shopping</Link>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        customer,
        paymentMethodId: selectedMethod || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      return setError(data.error || "Could not create order");
    }
    clearCart();
    navigate(`/order-success?ref=${data.reference}`);
  }

  const set = (field) => (event) =>
    setCustomer({ ...customer, [field]: event.target.value });

  return (
    <main className="container checkout-page">
      <h1>Checkout</h1>
      {error && <p className="form-error">{error}</p>}
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="auth-form">
          {!user && (
            <p className="auth-hint">
              Checking out as guest — no account required.
            </p>
          )}
          <label>
            Full name
            <input value={customer.name} onChange={set("name")} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={customer.email}
              onChange={set("email")}
              required
            />
          </label>
          <label>
            Street
            <input value={customer.street} onChange={set("street")} required />
          </label>
          <label>
            Neighborhood
            <input
              value={customer.neighborhood}
              onChange={set("neighborhood")}
              required
            />
          </label>
          <label>
            ZIP code
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={customer.zipCode}
              onChange={(e) =>
                setCustomer({ ...customer, zipCode: e.target.value.replace(/\D/g, "") })
              }
              required
            />
          </label>
          <label>
            Landmarks (optional)
            <input
              value={customer.landmarks}
              onChange={set("landmarks")}
            />
          </label>

          {user && methods.length > 0 && (
            <fieldset className="payment-choice">
              <legend>Pay with</legend>
              <label className="radio-label">
                <input
                  type="radio"
                  name="payment"
                  checked={!selectedMethod}
                  onChange={() => setSelectedMethod("")}
                />
                Pay later (no card)
              </label>
              {methods.map((method) => (
                <label key={method.id} className="radio-label">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedMethod === method.id}
                    onChange={() => setSelectedMethod(method.id)}
                  />
                  {method.brand} &bull;&bull;&bull;&bull; {method.last4}
                  {method.isPrimary ? " (primary)" : ""}
                </label>
              ))}
            </fieldset>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="order-summary">
          <h2>Your order</h2>
          {items.map((item) => (
            <div key={item.id} className="summary-line">
              <span>
                {item.quantity} &times; {item.name}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total</strong>
            <strong>${totalPrice.toFixed(2)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;