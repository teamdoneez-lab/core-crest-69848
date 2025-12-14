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
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`block transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {headlines[currentIndex]}
    </span>
  );
};