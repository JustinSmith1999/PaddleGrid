import { useState, useRef, useEffect } from 'react';
import { X, Upload, Type, Loader2, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import imageCompression from 'browser-image-compression';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  style: 'normal' | 'bold' | 'outlined';
}

interface StoryComposerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const TEXT_COLORS = [
  '#FFFFFF',
  '#000000',
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#007AFF',
  '#5856D6',
  '#FF2D55'
];

export default function StoryComposer({ onClose, onSuccess }: StoryComposerProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showTextOptions, setShowTextOptions] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please select an image or video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (editingTextId || draggingTextId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newText: TextElement = {
      id: Date.now().toString(),
      text: '',
      x,
      y,
      color: TEXT_COLORS[0],
      fontSize: 32,
      style: 'normal'
    };

    setTextElements([...textElements, newText]);
    setEditingTextId(newText.id);
    setShowTextOptions(true);
  }

  function handleTextChange(id: string, newText: string) {
    setTextElements(textElements.map(el =>
      el.id === id ? { ...el, text: newText } : el
    ));
  }

  function handleTextColorChange(id: string, color: string) {
    setTextElements(textElements.map(el =>
      el.id === id ? { ...el, color } : el
    ));
  }

  function handleTextStyleChange(id: string, style: 'normal' | 'bold' | 'outlined') {
    setTextElements(textElements.map(el =>
      el.id === id ? { ...el, style } : el
    ));
  }

  function handleMouseDown(e: React.MouseEvent, id: string) {
    if (editingTextId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const textEl = textElements.find(el => el.id === id);
    if (!textEl) return;

    const textX = (textEl.x / 100) * rect.width + rect.left;
    const textY = (textEl.y / 100) * rect.height + rect.top;

    setDraggingTextId(id);
    setDragOffset({
      x: e.clientX - textX,
      y: e.clientY - textY
    });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!draggingTextId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
    const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

    setTextElements(textElements.map(el =>
      el.id === draggingTextId ? { ...el, x, y } : el
    ));
  }

  function handleMouseUp() {
    setDraggingTextId(null);
  }

  function deleteText(id: string) {
    setTextElements(textElements.filter(el => el.id !== id));
    if (editingTextId === id) {
      setEditingTextId(null);
      setShowTextOptions(false);
    }
  }

  async function handleSubmit() {
    if (!user || !selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const img = new Image();
      img.src = previewUrl!;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      textElements.forEach(textEl => {
        if (!textEl.text.trim()) return;

        const x = (textEl.x / 100) * canvas.width;
        const y = (textEl.y / 100) * canvas.height;

        ctx.font = `${textEl.style === 'bold' ? 'bold' : 'normal'} ${textEl.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (textEl.style === 'outlined') {
          ctx.strokeStyle = textEl.color === '#FFFFFF' ? '#000000' : '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.strokeText(textEl.text, x, y);
          ctx.fillStyle = textEl.color;
          ctx.fillText(textEl.text, x, y);
        } else {
          ctx.fillStyle = textEl.color;
          ctx.fillText(textEl.text, x, y);
        }
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });

      let fileToUpload: File | Blob = blob;

      try {
        fileToUpload = await imageCompression(blob as File, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });
      } catch (compressionError) {
        console.error('Image compression failed, using original:', compressionError);
      }

      const fileName = `stories/${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('social-posts')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('social-posts')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: 'image',
          caption: null
        })
        .select();

      if (insertError) throw insertError;

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error creating story:', err);
      setError(err.message || 'Failed to create story');
    } finally {
      setUploading(false);
    }
  }

  const editingText = editingTextId ? textElements.find(el => el.id === editingTextId) : null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl ? (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Upload className="w-12 h-12 text-white" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                Create Story
              </div>
              <div className="text-white/70">
                Tap to upload a photo
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setTextElements([]);
                setEditingTextId(null);
              }}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTextOptions(!showTextOptions)}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors"
              >
                <Type className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={previewUrl}
              alt="Story"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />

            {textElements.map(textEl => (
              <div
                key={textEl.id}
                className="absolute"
                style={{
                  left: `${textEl.x}%`,
                  top: `${textEl.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: editingTextId === textEl.id ? 'text' : 'move'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (editingTextId !== textEl.id) {
                    handleMouseDown(e, textEl.id);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTextId(textEl.id);
                  setShowTextOptions(true);
                }}
              >
                {editingTextId === textEl.id ? (
                  <input
                    type="text"
                    value={textEl.text}
                    onChange={(e) => handleTextChange(textEl.id, e.target.value)}
                    onBlur={() => {
                      if (!textEl.text.trim()) {
                        deleteText(textEl.id);
                      } else {
                        setEditingTextId(null);
                      }
                    }}
                    autoFocus
                    className="bg-transparent border-none outline-none text-center"
                    style={{
                      color: textEl.color,
                      fontSize: `${textEl.fontSize}px`,
                      fontWeight: textEl.style === 'bold' ? 'bold' : 'normal',
                      textShadow: textEl.style === 'outlined'
                        ? `2px 2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}, -2px -2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}, 2px -2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}, -2px 2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}`
                        : 'none',
                      minWidth: '100px'
                    }}
                  />
                ) : (
                  <div
                    className="px-3 py-1 select-none"
                    style={{
                      color: textEl.color,
                      fontSize: `${textEl.fontSize}px`,
                      fontWeight: textEl.style === 'bold' ? 'bold' : 'normal',
                      textShadow: textEl.style === 'outlined'
                        ? `2px 2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}, -2px -2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}, 2px -2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}, -2px 2px 0 ${textEl.color === '#FFFFFF' ? '#000' : '#FFF'}`
                        : 'none'
                    }}
                  >
                    {textEl.text || 'Tap to type'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {showTextOptions && editingText && (
            <div className="absolute bottom-20 left-0 right-0 p-4 space-y-4">
              <div className="flex items-center justify-center gap-2 bg-black/70 backdrop-blur-sm rounded-2xl p-3">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleTextColorChange(editingText.id, color)}
                    className={`w-10 h-10 rounded-full transition-transform ${
                      editingText.color === color ? 'scale-110 ring-2 ring-white' : 'scale-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 bg-black/70 backdrop-blur-sm rounded-2xl p-3">
                <button
                  onClick={() => handleTextStyleChange(editingText.id, 'normal')}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    editingText.style === 'normal' ? 'bg-white/30' : 'hover:bg-white/10'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => handleTextStyleChange(editingText.id, 'bold')}
                  className={`px-4 py-2 rounded-lg text-white font-bold transition-colors ${
                    editingText.style === 'bold' ? 'bg-white/30' : 'hover:bg-white/10'
                  }`}
                >
                  Bold
                </button>
                <button
                  onClick={() => handleTextStyleChange(editingText.id, 'outlined')}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    editingText.style === 'outlined' ? 'bg-white/30' : 'hover:bg-white/10'
                  }`}
                  style={{
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  }}
                >
                  Outlined
                </button>
                <button
                  onClick={() => deleteText(editingText.id)}
                  className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-bold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Posting...
                </>
              ) : (
                'Share to Story'
              )}
            </button>
          </div>

          {error && (
            <div className="absolute top-20 left-4 right-4 p-4 bg-red-500/90 backdrop-blur-sm rounded-xl">
              <p className="text-sm text-white font-medium">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
