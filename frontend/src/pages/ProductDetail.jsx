import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page-note">Loading...</p>;
  if (!product) return <p className="page-note">Product not found.</p>;

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <main className="container">
      <Link to="/" className="back-link">Back to shop</Link>
      <div className="product-detail">
        <img src={product.imageUrl} alt={product.name} />
        <div>
          <h1>{product.name}</h1>
          <p className="product-category">{product.category.name}</p>
          <p>{product.description}</p>
          <p className="price">${Number(product.price).toFixed(2)}</p>
          <button className="add-to-cart" onClick={handleAdd}>
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default ProductDetail;