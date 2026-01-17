import { useState } from "react";
import { UploadPage } from "@/app/components/UploadPage";
import { DetailsPage } from "@/app/components/DetailsPage";
import { AnalysisData } from "@/app/data/dropdownOptions";

type AppState = "upload" | "details";

// Main App Component - English Only Version
function App() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleAnalysisComplete = (data: AnalysisData, images: string[]) => {
    setAnalysisData(data);
    setUploadedImages(images);
    setAppState("details");
  };

  const handleBack = () => {
    setAppState("upload");
  };

  return (
    <>
      {appState === "upload" && (
        <UploadPage onAnalysisComplete={handleAnalysisComplete} />
      )}
      {appState === "details" && analysisData && (
        <DetailsPage
          initialData={analysisData}
          images={uploadedImages}
          onBack={handleBack}
        />
      )}
    </>
  );
}

export default App;