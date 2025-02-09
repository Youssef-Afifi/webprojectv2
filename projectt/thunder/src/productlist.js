import React, { useState, useEffect } from 'react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
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
        setProducts(data);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
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
            {product.name} - {product.description} (price: {product.price}, (quantity: {product.quantity}))
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
