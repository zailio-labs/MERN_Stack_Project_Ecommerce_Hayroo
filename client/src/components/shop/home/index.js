import React, { Fragment, createContext, useReducer, useMemo } from "react";
import Layout from "../layout";
import Slider from "./Slider";
import ProductCategory from "./ProductCategory";
import { homeState, homeReducer } from "./HomeContext";
import SingleProduct from "./SingleProduct";

export const HomeContext = createContext();

const HomeComponent = () => {
  return (
    <Fragment>
      <Slider />
      {/* Category, Search & Filter Section */}
      <section className="m-4 md:mx-8 md:my-6">
        <ProductCategory />
      </section>
      {/* Product Section */}
      <section className="m-4 md:mx-8 md:my-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SingleProduct />
      </section>
    </Fragment>
  );
};

const Home = (props) => {
  const [data, dispatch] = useReducer(homeReducer, homeState);
  
  // Optional: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ data, dispatch }), [data, dispatch]);

  return (
    <Fragment>
      <HomeContext.Provider value={contextValue}>
        <Layout>
          <HomeComponent />
        </Layout>
      </HomeContext.Provider>
    </Fragment>
  );
};

export default Home;
