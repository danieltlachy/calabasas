import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="container">
        <h1>Cart</h1>
        <p className="page-note">Your cart is empty.</p>
        <Link to="/" className="back-link">Continue shopping</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Cart</h1>

      {items.map((item) => (
        <div key={item.id} className="cart-item">
          <img src={item.imageUrl} alt={item.name} />
          <div className="cart-item-info">
            <h3>{item.name}</h3>
            <p>${(item.price * item.quantity).toFixed(2)}</p>
          </div>
          <div className="cart-item-controls">
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
            <span className="cart-item-qty">{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            <button className="remove" onClick={() => removeFromCart(item.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="cart-summary">
        <p className="cart-total">
          Total {totalItems} items — <strong>${totalPrice.toFixed(2)}</strong>
        </p>
        <div className="cart-actions">
          <button onClick={clearCart}>Clear cart</button>
          <Link to="/checkout" className="checkout-button">Checkout</Link>
        </div>
      </div>
    </main>
  );
}

export default Cart;