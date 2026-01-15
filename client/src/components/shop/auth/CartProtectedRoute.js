import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticate } from "./fetchApi";

const CartProtectedRoute = ({ children }) => {
  const cart = localStorage.getItem("cart");
  
  if (cart && JSON.parse(cart).length !== 0 && isAuthenticate()) {
    return children;
  }
  
  return <Navigate to="/" replace />;
};

export default CartProtectedRoute;
