import { useCallback, useState } from 'react';

/**
 * DropZone Component
 * Drag-and-drop file upload zone with visual feedback
 */
const DropZone = ({ onFileSelect, isLoading = false, acceptedTypes = '.xlsx,.xls,.csv' }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isDragReject, setIsDragReject] = useState(false);

    const validateFile = (file) => {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragActive(true);

            // Check if file type is valid
            const item = e.dataTransfer.items[0];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file && !validateFile(file)) {
                    setIsDragReject(true);
                } else {
                    setIsDragReject(false);
                }
            }
        }
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        setIsDragReject(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        setIsDragReject(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                onFileSelect?.(file);
            }
            e.dataTransfer.clearData();
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                onFileSelect?.(file);
            }
        }
    }, [onFileSelect]);

    const getDropZoneClasses = () => {
        let classes = 'dropzone';
        if (isDragReject) {
            classes += ' dropzone-reject';
        } else if (isDragActive) {
            classes += ' dropzone-active';
        }
        return classes;
    };

    return (
        <div
            className={getDropZoneClasses()}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <input
                id="file-input"
                type="file"
                accept={acceptedTypes}
                onChange={handleFileInput}
                className="hidden"
            />

            {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Processing your file...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    {/* Upload Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${isDragReject
                            ? 'bg-red-100'
                            : isDragActive
                                ? 'bg-primary-100'
                                : 'bg-gray-100'
                        }`}>
                        {isDragReject ? (
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        )}
                    </div>

                    {/* Text */}
                    <div className="text-center">
                        {isDragReject ? (
                            <>
                                <p className="text-red-600 font-semibold text-lg">Invalid file type</p>
                                <p className="text-red-500 text-sm mt-1">Please use Excel (.xlsx, .xls) or CSV files</p>
                            </>
                        ) : isDragActive ? (
                            <>
                                <p className="text-primary-600 font-semibold text-lg">Drop your file here</p>
                                <p className="text-primary-500 text-sm mt-1">Release to upload</p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-700 font-semibold text-lg">
                                    Drag & drop your data file here
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                    or <span className="text-primary-500 hover:text-primary-600 font-medium">browse</span> to choose a file
                                </p>
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                                        .xlsx
                                    </span>
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                                        .xls
                                    </span>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                                        .csv
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropZone;
