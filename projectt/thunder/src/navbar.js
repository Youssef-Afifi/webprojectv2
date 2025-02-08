import React from "react";

const navbar = ({ navigate }) => {
  return (
    <nav>
      <button onClick={() => navigate("login")}>Login</button>
      <button onClick={() => navigate("register")}>Register</button>
    </nav>
  );
};

export default navbar;
