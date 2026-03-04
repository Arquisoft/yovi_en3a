import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import React from "react";
import ReactDOM from "react-dom/client";
import RoutesWrapper from "./RoutesWrapper";
import "./index.css";



ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RoutesWrapper />
  </React.StrictMode>
);
