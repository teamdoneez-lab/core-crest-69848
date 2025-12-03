import { useState, useEffect } from 'react';

const headlines = [
  "Auto Repair",
  "Auto Body",
  "Car Customization",
  "Auto Detailing",
  "Tire & Wheel Services",
];

export const RotatingHeadline = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % headlines.length);
        setIsVisible(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`block transition-all duration-400 ease-in-out whitespace-nowrap ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-2'
      }`}
    >
      {headlines[currentIndex]}
    </span>
  );
};
