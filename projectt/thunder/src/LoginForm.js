import React from 'react';

import { useNavigate } from 'react-router-dom';



const LoginForm = () => {
  const navigate = useNavigate();
  let email = '';
  let password = '';
  let message = '';
  const loginUser = async () => {
    try{
   const response= await fetch('http://localhost:555/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
        if (!response.ok) {
          throw new Error('Invalid credentials');
        }
        const userData=await response.json();
        console.log(userData);
        localStorage.setItem('user', JSON.stringify({
          name: userData.name,
          admin: userData.isAdmin
        }));
        if(userData.admin===1) {
          navigate('/addproduct')
        }else {
          navigate('/products')
        }
}
      
      catch(error)  {
        message = error.message;
        alert(message);
      };
  };


  return (
    <div className="form-section">
      <h3>User Login</h3>
      <form>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => (email = e.target.value)} 
          required
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => (password = e.target.value)} 
          required
        />
        <br />
        <button type="button" onClick={loginUser}>
          Login
        </button>
      </form>
      <p>{message}</p>    
      </div>
  );
};

export default LoginForm;
