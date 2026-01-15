import React, { Fragment, createContext, useReducer, useMemo } from "react";
import Layout from "../layout";
import {
  productDetailsState,
  productDetailsReducer,
} from "./ProductDetailsContext";
import Details from "./Details";

export const ProductDetailsContext = createContext();

const DetailsComponent = () => {
  return (
    <Fragment>
      <Details />
    </Fragment>
  );
};

const ProductDetails = (props) => {
  const [data, dispatch] = useReducer(
    productDetailsReducer,
    productDetailsState
  );
  
  // Optional: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ data, dispatch }), [data, dispatch]);

  return (
    <Fragment>
      <ProductDetailsContext.Provider value={contextValue}>
        <Layout>
          <DetailsComponent />
        </Layout>
      </ProductDetailsContext.Provider>
    </Fragment>
  );
};

export default ProductDetails;
