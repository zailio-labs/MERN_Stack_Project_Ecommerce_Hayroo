import React, { Fragment, createContext, useReducer, useMemo } from "react";
import AdminLayout from "../layout";
import ProductMenu from "./ProductMenu";
import ProductTable from "./ProductTable";
import { productState, productReducer } from "./ProductContext";

/* This context manage all of the products component's data */
export const ProductContext = createContext();

const ProductComponent = () => {
  return (
    <div className="grid grid-cols-1 space-y-4 p-4">
      <ProductMenu />
      <ProductTable />
    </div>
  );
};

const Products = (props) => {
  /* To use useReducer make sure that reducer is the first arg */
  const [data, dispatch] = useReducer(productReducer, productState);
  
  // Optional: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ data, dispatch }), [data, dispatch]);

  return (
    <Fragment>
      <ProductContext.Provider value={contextValue}>
        <AdminLayout>
          <ProductComponent />
        </AdminLayout>
      </ProductContext.Provider>
    </Fragment>
  );
};

export default Products;
