import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { AnalysisData } from "@/app/data/dropdownOptions";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface UploadPageProps {
  onAnalysisComplete: (
    data: AnalysisData,
    images: string[],
  ) => void;
}

// Upload page for image analysis
export function UploadPage({
  onAnalysisComplete,
}: UploadPageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);

    if (files.length + images.length > 4) {
      setError("Maximum 4 images allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [
            ...prev,
            event.target!.result as string,
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress steps
      setProgress(10);

      // Prepare images
      setProgress(20);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c912d88d/analyze-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ images }),
        },
      );

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.error || "Failed to analyze images",
        );
      }

      const data = await response.json();
      console.log("Analysis successful:", data);

      setProgress(100);

      // Small delay to show 100% before transitioning
      setTimeout(() => {
        onAnalysisComplete(data.analysis, images);
      }, 300);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred";
      setError(errorMessage);
      console.error(
        "Error analyzing images:",
        errorMessage,
        err,
      );
      setProgress(0);
    } finally {
      setTimeout(() => {
        setAnalyzing(false);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SAC Instruction Sheet Generation System
          </h1>
          <p className="text-gray-600 mb-8">
            Upload 1-4 images to analyze and generate an
            instruction PDF
          </p>

          {/* Upload Area */}
          <div className="mb-8">
            <label htmlFor="file-upload" className="block mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Click to upload images or drag and drop
                </p>
                <p className="text-gray-500 text-sm">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
              disabled={images.length >= 4}
            />
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {images.length} images
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {analyzing && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Analyzing images...
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || images.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Images"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}