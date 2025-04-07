import React from "react";
import Anemone from "@/components/Anemone";

const AnemoneDemo: React.FC = () => {
  return (
    <div className="app">
      <Anemone 
        id="background-anemone" 
        backgroundColor="#0a4766"
        particleSpeed={1.5} 
      />    
    </div>
  );
};

export default AnemoneDemo;