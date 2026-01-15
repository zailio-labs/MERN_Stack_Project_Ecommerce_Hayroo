import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { SnackbarProvider } from 'notistack';

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3}> 
      <App />
    </SnackbarProvider>
  </React.StrictMode>
);

serviceWorker.unregister();
