import { useState } from "react";
import { Download, ArrowLeft } from "lucide-react";
import { dropdownOptions, AnalysisData } from "@/app/data/dropdownOptions";
import { jsPDF } from "jspdf";

interface DetailsPageProps {
  initialData: AnalysisData;
  images: string[];
  onBack: () => void;
}

// Details page with form and PDF generation
export function DetailsPage({ initialData, images, onBack }: DetailsPageProps) {
  const [formData, setFormData] = useState<AnalysisData>(initialData);

  const handleChange = (field: keyof AnalysisData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('SAC Instruction Sheet', pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Details Section First
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 15;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Details', 20, yPos);
      yPos += 10;

      // Field definitions with English labels
      const fields = [
        { label: 'Purpose', key: 'purpose' as keyof AnalysisData },
        { label: 'Subject', key: 'subject' as keyof AnalysisData },
        { label: 'Situation', key: 'situation' as keyof AnalysisData },
        { label: 'Age Range', key: 'age_range' as keyof AnalysisData },
        { label: 'Gender', key: 'gender' as keyof AnalysisData },
        { label: 'Nationality', key: 'nationality' as keyof AnalysisData },
        { label: 'Style', key: 'style' as keyof AnalysisData },
        { label: 'Shot Distance', key: 'shot_distance' as keyof AnalysisData },
        { label: 'Camera Angle', key: 'camera_angle' as keyof AnalysisData },
        { label: 'Lighting/Color', key: 'lighting_color' as keyof AnalysisData },
        { label: 'Background', key: 'background' as keyof AnalysisData },
        { label: 'City', key: 'city' as keyof AnalysisData },
        { label: 'Location Type', key: 'location_type' as keyof AnalysisData },
        { label: 'Output Format', key: 'output_format' as keyof AnalysisData },
        { label: 'Aspect Ratio', key: 'aspect_ratio' as keyof AnalysisData },
        { label: 'Additional Words', key: 'additional_words' as keyof AnalysisData },
      ];

      // Table rendering
      const tableStartY = yPos;
      const fieldColWidth = 60;
      const valueColWidth = 120;
      const tableX = 20;
      const rowHeight = 10;
      const cellPadding = 2;

      // Draw table header
      doc.setFillColor(66, 139, 202);
      doc.rect(tableX, tableStartY, fieldColWidth, rowHeight, 'F');
      doc.rect(tableX + fieldColWidth, tableStartY, valueColWidth, rowHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Field', tableX + cellPadding, tableStartY + 6);
      doc.text('Value', tableX + fieldColWidth + cellPadding, tableStartY + 6);
      
      doc.setTextColor(0, 0, 0);
      yPos = tableStartY + rowHeight;

      // Draw table rows
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const value = formData[field.key] || '';

        // Check if we need a new page
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        // Draw borders
        doc.setDrawColor(200, 200, 200);
        doc.rect(tableX, yPos, fieldColWidth, rowHeight);
        doc.rect(tableX + fieldColWidth, yPos, valueColWidth, rowHeight);

        // Render field label (left column)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(field.label, tableX + cellPadding, yPos + 6);

        // Render field value (right column)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const maxWidth = valueColWidth - cellPadding * 2;
        const lines = doc.splitTextToSize(String(value), maxWidth);
        doc.text(lines, tableX + fieldColWidth + cellPadding, yPos + 6);

        yPos += rowHeight;
      }

      // Images Section at Bottom
      if (images.length > 0) {
        yPos += 15;

        // Check if we need a new page for images
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = 20;
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 15;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Reference Image', 20, yPos);
        yPos += 10;

        const aspectRatio = formData.aspect_ratio || "1:1";
        const maxWidth = 80;

        const getImageDimensions = (ratio: string) => {
          switch (ratio) {
            case "1:1":
              return { width: maxWidth, height: maxWidth };
            case "3:4":
              return { width: maxWidth * 0.75, height: maxWidth };
            case "4:3":
              return { width: maxWidth, height: maxWidth * 0.75 };
            case "9:16":
              return { width: maxWidth * 0.5625, height: maxWidth };
            case "16:9":
              return { width: maxWidth, height: maxWidth * 0.5625 };
            case "21:9":
              return { width: maxWidth, height: maxWidth * (9 / 21) };
            default:
              return { width: maxWidth, height: maxWidth * 0.75 };
          }
        };

        const { width: imageWidth, height: imageHeight } = getImageDimensions(aspectRatio);
        const imagesPerRow = 2;
        const spacing = 10;
        const startX = (pageWidth - (imageWidth * imagesPerRow + spacing * (imagesPerRow - 1))) / 2;

        const cropImageToAspectRatio = (imgSrc: string, targetWidth: number, targetHeight: number): Promise<string> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }

              canvas.width = targetWidth * 10;
              canvas.height = targetHeight * 10;

              const targetAspect = targetWidth / targetHeight;
              const imgAspect = img.width / img.height;

              let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

              if (imgAspect > targetAspect) {
                sWidth = img.height * targetAspect;
                sx = (img.width - sWidth) / 2;
              } else {
                sHeight = img.width / targetAspect;
                sy = (img.height - sHeight) / 2;
              }

              ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imgSrc;
          });
        };

        for (let index = 0; index < images.length; index++) {
          if (index > 0 && index % 4 === 0) {
            doc.addPage();
            yPos = 20;
          }

          const row = Math.floor(index % 4 / imagesPerRow);
          const col = index % imagesPerRow;
          const xPos = startX + col * (imageWidth + spacing);
          const currentYPos = yPos + row * (imageHeight + spacing);

          try {
            const croppedImage = await cropImageToAspectRatio(images[index], imageWidth, imageHeight);
            doc.addImage(croppedImage, 'JPEG', xPos, currentYPos, imageWidth, imageHeight);
          } catch (e) {
            console.error("Error cropping/adding image to PDF:", e);
          }
        }
      }

      doc.save('instruction.pdf');
      
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Edit Details
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and modify the analyzed data
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Images Preview */}
          {images && images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Uploaded Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6 mb-8">
            {(Object.keys(dropdownOptions) as Array<keyof typeof dropdownOptions>).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </label>
                <select
                  value={formData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23374151%22%20d%3D%22M10.293%203.293%206%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[position:right_1rem_center] bg-no-repeat"
                >
                  {dropdownOptions[field].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            
            {/* Additional Words Text Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Words
              </label>
              <textarea
                value={formData.additional_words}
                onChange={(e) => handleChange("additional_words", e.target.value)}
                placeholder="Enter any additional instructions here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={generatePDF}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}