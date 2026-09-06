import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#222",
      "::placeholder": { color: "#999" },
    },
    invalid: { color: "#9e2146" },
  },
};

function PaymentMethodsSection() {
  const stripe = useStripe();
  const elements = useElements();
  const [methods, setMethods] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/users/me/payment-methods");
    if (res.ok) setMethods(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function saveCard(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!stripe || !elements) return setError("Card form not ready yet.");
    const cardElement = elements.getElement(CardElement);
    setSaving(true);
    const { error: stripeError, paymentMethod } =
      await stripe.createPaymentMethod({ type: "card", card: cardElement });
    if (stripeError) {
      setSaving(false);
      return setError(stripeError.message);
    }
    const res = await fetch("/api/users/me/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripePaymentMethodId: paymentMethod.id }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Could not save card");
    setMessage("Card saved.");
    cardElement.clear();
    load();
  }

  async function setPrimary(id) {
    await fetch(`/api/users/me/payment-methods/${id}/primary`, { method: "POST" });
    load();
  }

  async function remove(id) {
    await fetch(`/api/users/me/payment-methods/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="payment-section">
      <h2>Payment methods</h2>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      {methods.length === 0 && <p className="page-note">No cards saved yet.</p>}
      {methods.map((method) => (
        <div key={method.id} className="pay-item">
          <h4>
            {method.brand} &bull;&bull;&bull;&bull; {method.last4}
            {method.isPrimary && <span className="primary-tag">Primary</span>}
          </h4>
          <div className="address-actions">
            {!method.isPrimary && (
              <button className="set-primary" onClick={() => setPrimary(method.id)}>
                Set as primary
              </button>
            )}
            <button onClick={() => remove(method.id)}>Remove</button>
          </div>
        </div>
      ))}

      <form onSubmit={saveCard} className="auth-form">
        <label>
          New card
          <div className="stripe-card-input">
            <CardElement options={CARD_OPTIONS} />
          </div>
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save card"}
        </button>
      </form>
      <p className="auth-hint">
        Test mode: use card 4242 4242 4242 4242, any future date, any CVC.
      </p>
    </section>
  );
}

export default PaymentMethodsSection;