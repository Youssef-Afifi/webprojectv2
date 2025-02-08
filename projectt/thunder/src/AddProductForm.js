import React, { useState } from 'react';


const AddProducts = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState(''); 

  const addProduct = () => {
    fetch('http://localhost:555/products/addproduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name, description, price, quantity }), 
      credentials:"include"
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to add product. status code ${response.status}, message
          ${JSON.stringify(response.text())}`);
      }
      setMessage('product added successfully');
      alert('product added successfully'); 
    })
    .catch((error) => {
      setMessage(`Error: ${error.message}`); 
      alert(error.message); 
    });
  };
  return (
    <div className="form-section">
      <h3>Add product (Admin)</h3>
      <form>
        <input 
          type="text" 
          placeholder="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        /><br />
        <input 
          type="text" 
          placeholder="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
        /><br />
        <input 
          type="number" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          required 
        /><br />
        <input 
          type="number" 
          placeholder="Quantity" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          required 
        /><br />
        <button type="button" onClick={addProduct}>Add product</button>
      </form>
      {message && <p>{message}</p>} 
    </div>
  );
};

export default AddProducts;
