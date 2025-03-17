import Image from 'next/image';
import React from 'react';

interface CardStackProps {
  items: string;
}

export const CardStack: React.FC<CardStackProps> = ({ items }) => {
  return (
    <div className="relative w-full h-full">
      <Image
        src={items}
        alt={`Stack item`}
        fill
        className="object-cover rounded-lg"
      />
    </div>
  );
}; 