import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Card({ children, className, id, onClick }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-6 shadow-sm",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
