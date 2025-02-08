
import "./App.css";
import React  from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home';
import LoginForm from './LoginForm';
import Register from "./register.js"; 
import Navbar from "./navbar"; 
import AddProducts from "./AddProductForm.js";



const App = () => {
  return (
    <Router>
      <Navbar />
        <Routes>
         <Route path="/" element={<Home/>} />
         <Route path="/home" element={<Home />} />
         <Route path="/login" element={<LoginForm />} />
         <Route path="/register" element={<Register />} />
         <Route path="/addproduct" element={<AddProducts />} />
      </Routes>
    </Router>
  );
};

export default App;
