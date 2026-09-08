import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";

function EnsureAuthEnabled({ children }) {
  const { authEnabled } = useAuth();
  if (!authEnabled) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/register" element={<EnsureAuthEnabled><Register /></EnsureAuthEnabled>} />
            <Route path="/verify" element={<EnsureAuthEnabled><Verify /></EnsureAuthEnabled>} />
            <Route path="/login" element={<EnsureAuthEnabled><Login /></EnsureAuthEnabled>} />
            <Route path="/forgot-password" element={<EnsureAuthEnabled><ForgotPassword /></EnsureAuthEnabled>} />
            <Route path="/reset-password" element={<EnsureAuthEnabled><ResetPassword /></EnsureAuthEnabled>} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;