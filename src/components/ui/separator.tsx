"use client"

import * as React from "react"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = "", orientation = "horizontal", ...props }, ref) => {
    const orientationClass = orientation === "horizontal" 
      ? "h-[1px] w-full border-b" 
      : "w-[1px] h-full border-r";
    
    return (
      <div
        ref={ref}
        className={`border-gray-200 ${orientationClass} ${className}`}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator } 