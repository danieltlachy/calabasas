import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { totalItems } = useCart();
  const { user, loading, authEnabled, logout } = useAuth();

  return (
    <header className="site-header">
      <Link to="/" className="brand">CALABASAS</Link>
      <nav>
        <Link to="/">Shop</Link>
        <Link to="/cart">
          Cart
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </Link>
        {!loading &&
          (user ? (
            <>
              <Link to="/orders">Orders</Link>
              <Link to="/account" className="user-name">{user.name}</Link>
              <button className="nav-link-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : authEnabled ? (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <span className="auth-hint">Demo — accounts disabled</span>
          ))}
      </nav>
    </header>
  );
}

export default Header;