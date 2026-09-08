import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../context/AuthContext";
import PaymentMethodsSection from "../components/PaymentMethodsSection";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function Account() {
  const { user, loading, setUser } = useAuth();

  const [stripeMode, setStripeMode] = useState({ status: "loading", stripe: null });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    street: "",
    neighborhood: "",
    zipCode: "",
    landmarks: "",
  });
  const [addressMessage, setAddressMessage] = useState("");
  const [addressError, setAddressError] = useState("");

  async function loadAddresses() {
    const res = await fetch("/api/users/me/addresses");
    if (res.ok) setAddresses(await res.json());
  }

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    loadAddresses();
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadStripeKey() {
      let key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      try {
        const res = await fetch("/api/stripe/config");
        if (res.ok) key = (await res.json()).publishableKey || key;
      } catch {}
      if (!cancelled) {
        setStripeMode({
          status: key ? "ready" : "missing",
          stripe: key ? loadStripe(key) : null,
        });
      }
    }
    loadStripeKey();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="page-note">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  async function saveProfile(e) {
    e.preventDefault();
    setSaveError("");
    setSavedMessage("");
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return setSaveError(data.error || "Could not update profile");
    }
    setUser(data.user);
    setSavedMessage(data.message);
  }

  async function addAddress(e) {
    e.preventDefault();
    setAddressError("");
    setAddressMessage("");
    const res = await fetch("/api/users/me/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      return setAddressError(data.error || "Could not add address");
    }
    setForm({ street: "", neighborhood: "", zipCode: "", landmarks: "" });
    setAddressMessage("Address added.");
    loadAddresses();
  }

  async function setPrimary(id) {
    await fetch(`/api/users/me/addresses/${id}/primary`, { method: "POST" });
    loadAddresses();
  }

  async function removeAddress(id) {
    await fetch(`/api/users/me/addresses/${id}`, { method: "DELETE" });
    loadAddresses();
  }

  return (
    <main className="container account-page">
      <h1>My account</h1>

      <div className="account-grid">
        <section>
          <h2>Profile</h2>
          {saveError && <p className="form-error">{saveError}</p>}
          {savedMessage && <p className="form-success">{savedMessage}</p>}
          <form onSubmit={saveProfile} className="auth-form">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit">Save changes</button>
          </form>
        </section>

        <section>
          <h2>Shipping addresses</h2>
          {addressError && <p className="form-error">{addressError}</p>}
          {addressMessage && <p className="form-success">{addressMessage}</p>}

          {addresses.length === 0 && <p className="page-note">No addresses yet.</p>}
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`address-item${address.isPrimary ? " is-primary" : ""}`}
            >
              <h4>
                {address.street}
                {address.isPrimary && <span className="primary-tag">Primary</span>}
              </h4>
              <p>
                {address.neighborhood} &middot; {address.zipCode}
              </p>
              {address.landmarks && <p>{address.landmarks}</p>}
              <div className="address-actions">
                {!address.isPrimary && (
                  <button
                    className="set-primary"
                    onClick={() => setPrimary(address.id)}
                  >
                    Set as primary
                  </button>
                )}
                <button onClick={() => removeAddress(address.id)}>Delete</button>
              </div>
            </div>
          ))}

          <h2>Add address</h2>
          <form onSubmit={addAddress} className="auth-form">
            <label>
              Street
              <input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                required
              />
            </label>
            <label>
              Neighborhood
              <input
                value={form.neighborhood}
                onChange={(e) =>
                  setForm({ ...form, neighborhood: e.target.value })
                }
                required
              />
            </label>
            <label>
              ZIP code
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.zipCode}
                onChange={(e) =>
                  setForm({ ...form, zipCode: e.target.value.replace(/\D/g, "") })
                }
                required
              />
            </label>
            <label>
              Landmarks (optional)
              <input
                value={form.landmarks}
                onChange={(e) => setForm({ ...form, landmarks: e.target.value })}
              />
            </label>
            <button type="submit">Add address</button>
          </form>
        </section>
      </div>

      {stripeMode.status === "loading" ? (
        <p className="page-note">Loading payment...</p>
      ) : stripeMode.status === "ready" ? (
        <Elements stripe={stripeMode.stripe}>
          <PaymentMethodsSection />
        </Elements>
      ) : (
        <p className="page-note">Stripe card saving is not configured.</p>
      )}

      <p className="auth-switch">
        <Link to="/">Back to shop</Link>
      </p>
    </main>
  );
}

export default Account;