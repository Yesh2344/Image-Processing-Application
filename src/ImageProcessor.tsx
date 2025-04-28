import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import {
  ArrowUpTrayIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

interface ImageProcessorProps {
  darkMode: boolean;
}

export function ImageProcessor({ darkMode }: ImageProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const saveImage = useMutation(api.images.saveImage);
  const images = useQuery(api.images.listImages);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        // Reset filters when new image is loaded
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select an image file");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const getCroppedImg = async (format: string) => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw the image with current crop
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise<Blob>((resolve, reject) => {
      if (format === "pdf") {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
        const blob = pdf.output("blob");
        resolve(blob);
      } else {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob conversion failed"));
          },
          format === "jpeg" ? "image/jpeg" : "image/png",
          1
        );
      }
    });
  };

  const handleExport = async (format: string) => {
    try {
      if (!selectedFile || !completedCrop) {
        toast.error("Please select an image and crop it first");
        return;
      }

      const blob = await getCroppedImg(format);
      if (!blob) return;

      if (format === "pdf") {
        saveAs(blob, `cropped-image.pdf`);
      } else {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type },
          body: blob,
        });
        const { storageId } = await result.json();
        await saveImage({
          storageId,
          name: selectedFile.name,
          format,
        });
        toast.success("Image processed successfully!");
      }
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
          Advanced Image Processor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload, crop, enhance, and convert your images to different formats
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
            : "border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400"
        } ${darkMode ? 'dark:bg-gray-800' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Drag and drop an image here, or click to select
          </span>
        </label>
      </div>

      {previewUrl && (
        <>
          <div className="flex items-center gap-4 justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reset Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brightness ({brightness}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contrast ({contrast}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Saturation ({saturation}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rotation ({rotation}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
            >
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            </ReactCrop>
          </div>
        </>
      )}

      {completedCrop && (
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => handleExport("jpeg")}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export as JPEG
          </button>
          <button
            onClick={() => handleExport("png")}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export as PNG
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export as PDF
          </button>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Processed Images</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images?.map((image) => (
            <div key={image._id} className="border dark:border-gray-700 rounded-lg p-2 shadow-sm bg-white dark:bg-gray-800">
              <img
                src={image.url ?? ""}
                alt={image.name}
                className="w-full h-40 object-cover rounded"
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {image.name} ({image.format})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
