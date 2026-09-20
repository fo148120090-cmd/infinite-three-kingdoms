import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import BlacksmithNpc from "./BlacksmithNpc";
import "./styles.css";
import "./blacksmithNpc.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <>
      <App />
      <BlacksmithNpc />
    </>
  </React.StrictMode>
);
