import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * useChartExport Hook
 * Provides PDF export and clipboard copy functionality for charts
 */
export const useChartExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState(null);

    /**
     * Capture an element as a canvas image
     * @param {HTMLElement} element - DOM element to capture
     * @returns {Promise<HTMLCanvasElement>}
     */
    const captureElement = async (element) => {
        if (!element) throw new Error('Element not found');

        return await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#f8fafc', // Match app background
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });
    };

    /**
     * Export charts container to PDF
     * @param {React.RefObject} containerRef - Ref to the charts container
     * @param {string} filename - PDF filename (without extension)
     * @returns {Promise<boolean>} Success status
     */
    const exportToPDF = useCallback(async (containerRef, filename = 'charts-report') => {
        if (!containerRef?.current) {
            setExportError('No charts to export');
            return false;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            const element = containerRef.current;
            const canvas = await captureElement(element);

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Calculate PDF dimensions (A4 width with proportional height)
            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

            const pdf = new jsPDF({
                orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Add timestamp to filename
            const timestamp = new Date().toISOString().slice(0, 10);
            pdf.save(`${filename}-${timestamp}.pdf`);

            setIsExporting(false);
            return true;
        } catch (error) {
            console.error('PDF export error:', error);
            setExportError('Failed to export PDF');
            setIsExporting(false);
            return false;
        }
    }, []);

    /**
     * Copy charts as image to clipboard
     * @param {React.RefObject} containerRef - Ref to the charts container
     * @returns {Promise<boolean>} Success status
     */
    const copyToClipboard = useCallback(async (containerRef) => {
        if (!containerRef?.current) {
            setExportError('No charts to copy');
            return false;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            const element = containerRef.current;
            const canvas = await captureElement(element);

            // Convert canvas to blob
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });

            if (!blob) throw new Error('Failed to create image');

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
            ]);

            setIsExporting(false);
            return true;
        } catch (error) {
            console.error('Clipboard copy error:', error);
            setExportError('Failed to copy to clipboard');
            setIsExporting(false);
            return false;
        }
    }, []);

    /**
     * Clear any export errors
     */
    const clearError = useCallback(() => {
        setExportError(null);
    }, []);

    return {
        exportToPDF,
        copyToClipboard,
        isExporting,
        exportError,
        clearError,
    };
};

export default useChartExport;
