import React, { useState, useEffect } from 'react';

const ProductList = () => {
  const [products, setProducts] = useState([]);

  const userId = localStorage.getItem("userId");

  const getAllProducts = () => {
    fetch('http://localhost:555/products')
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.error('Failed to fetch products');
          return [];
        }
      })
      .then((data) => {
        console.log("fetched products", data);
        setProducts(data);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  };
  const addToCart = (productId) => {
    fetch("http://localhost:555/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, productId, quantity: 1 }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add product to cart");
        }
        return response.text();
      })
      .then((data) => {
        alert(data); 
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert("Failed to add product to cart");
      });
  };


  useEffect(() => {
    getAllProducts();
  }, []);

  return (
    <div className="form-section">
      <h3>View All products</h3>
      <button onClick={getAllProducts}>view products</button>
      <ul>
        {products.map((product) => (
          <li key={product.ID}>
            {product.NAME} - {product.DESCRIPTION} (price: {product.PRICE} (quantity: {product.QUANTITY}))
            <button onClick={() => addToCart(product.ID)}>Add to Cart</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
