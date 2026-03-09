import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import {GameScreen} from "./GameScreen";

export default function RoutesWrapper() {
  return (
    <BrowserRouter> 
      <Routes>
        {/* existing app */}
        <Route path="/" element={<App />} />

        {/* New route for development */}
        <Route path="/game" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}