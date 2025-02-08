import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const laptops = [
  {
    id: 1,
    model: "Dell XPS 13 Plus Core i5-1340P, 8GB RAM, 512GB SSD, Intel UHD graphics",
    price: 999,
    image: "XPS.jpeg",
  },
  {
    id: 2,
    model: "Lenovo LOQ i7 15IRH8 NVIDIA GeForce RTX 4050-15.6 FHD - 144Hz - 16GB RAM - 1TB SSD",
    price: 1299,
    image: "LOQ.jpg",
  },
  {
    id: 3,
    model: "HP Pavilion 13.3 FHD. Intel core i3, 8GB RAM",
    price: 699,
    image: "HP.jpeg",
  },
  {
    id: 4,
    model: "Lenovo ThinkPad X1 Carbon Intel Core i7, 8GB RAM, 256GB SSD",
    price: 759,
    image: "thinkpad.jpg",
  },
];


export default Products;