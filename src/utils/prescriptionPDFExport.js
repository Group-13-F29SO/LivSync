import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportPrescriptionToPDF = async (element, patientName, providerId) => {
  try {
    if (!element) {
      throw new Error('Template element not found');
    }

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true);
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm';
    tempContainer.style.background = 'white';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    try {
      // Convert HTML to canvas with better error handling
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: false,
      });

      // Create PDF with dimensions matching A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Convert canvas to JPEG for better compatibility
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      let position = 0;
      let heightLeft = imgHeight;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `prescription-${patientName.replace(/\s+/g, '-')}-${timestamp}.pdf`;

      // Download the PDF
      pdf.save(fileName);

      return { success: true, fileName };
    } finally {
      // Clean up temporary container
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};
