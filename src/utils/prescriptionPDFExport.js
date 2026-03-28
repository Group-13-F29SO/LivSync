import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportPrescriptionToPDF = async (element, patientName, providerId) => {
  try {
    // Get the element to convert
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF with dimensions matching A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add multiple pages if content exceeds one page
    let heightLeft = imgHeight - 297; // A4 height in mm
    let position = 0;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `prescription-${patientName.replace(/\s+/g, '-')}-${timestamp}.pdf`;

    // Download the PDF
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};
