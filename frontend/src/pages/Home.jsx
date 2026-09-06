import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter ? `/api/products?category=${filter}` : "/api/products";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  if (loading) return <p className="page-note">Loading products...</p>;

  return (
    <main className="container">
      <h1>Shop</h1>
      <div className="filters">
        <button onClick={() => setFilter("")}>All</button>
        <button onClick={() => setFilter("clothing")}>Clothing</button>
        <button onClick={() => setFilter("shoes")}>Tennis Shoes</button>
      </div>

      {products.length === 0 ? (
        <p className="page-note">No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="product-card"
            >
              <img src={product.imageUrl} alt={product.name} />
              <h3>{product.name}</h3>
              <p>${Number(product.price).toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default Home;