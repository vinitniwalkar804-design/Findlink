import { useEffect, useRef, useState } from 'react';
import { X, ImageIcon } from 'lucide-react';
import { uploadImage } from '../lib/storage';
import { Spinner } from './ui';


interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  required?: boolean;
}

export function ImageUpload({ value, onChange, folder, label = 'Photo', required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);


  useEffect(() => {
    setImageLoadError(false);
    if (!value) {
      setPreviewUrl(null);
    }
  }, [value]);


  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    const { url, error: uploadError } = await uploadImage(file, folder);
    if (uploadError) {
      setError(uploadError);
      setPreviewUrl(null);
    } else {
      onChange(url);
      setPreviewUrl(url);
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const resetSelection = () => {
    onChange('');
    setPreviewUrl(null);
    setError(null);
    setImageLoadError(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };


  const displayUrl = previewUrl || value;

  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500">*</span>}</label>
      {displayUrl && !imageLoadError ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            onError={() => setImageLoadError(true)}
          />
          <button
            type="button"
            onClick={resetSelection}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (

        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
        >
          {uploading ? (
            <Spinner size={24} />
          ) : (
            <>
              <ImageIcon size={24} className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-500 text-center px-2">Click or drop image</span>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {displayUrl && imageLoadError && (
        <p className="mt-1 text-xs text-red-600">Image failed to load. Please re-upload.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
