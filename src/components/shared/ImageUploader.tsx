import React, { useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  images: string[];
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
  maxCount?: number;
}

export function ImageUploader({ images, onUpload, onRemove, maxCount = 9 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div>
      {images.length < maxCount && (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2",
            "rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6",
            "transition-colors hover:border-[#0A6EBD] hover:bg-blue-50"
          )}
        >
          <Upload className="h-8 w-8 text-gray-400" />
          <span className="text-sm text-gray-500">点击或拖拽上传图片</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {images.map((src, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-gray-100">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => onRemove(index)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
