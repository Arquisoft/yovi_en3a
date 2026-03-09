import React from 'react';

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


interface AuthLandingProps {
  onSelectLogin: () => void;
  onSelectRegister: () => void;
}

const Landing: React.FC<AuthLandingProps> = ({ onSelectLogin, onSelectRegister }) => {
  return (
    <div className="auth-landing">
      
      <p>Choose what you'd like to do:</p>
      
      <div className="auth-buttons">
        <button className="auth-button login-button" onClick={onSelectLogin}>
          Login
        </button>
        <button className="auth-button register-button" onClick={onSelectRegister}>
          Sign Up
        </button>
      </div>

      
   {/* ⚠️ TEMPORARY DEV BUTTON */}
      <div className="mt-6 p-4 border border-red-400 rounded-md bg-red-50">
        <p className="text-red-700 text-sm mb-2">Development shortcut</p>
        <Link to="/game">
          <Button variant="destructive">
            Go to Game Board
          </Button>
        </Link>
      </div>
      {/* ⚠️ REMOVE THIS AFTER MENU IMPLEMENTATION */}



    </div>
  );
};

export default Landing;
