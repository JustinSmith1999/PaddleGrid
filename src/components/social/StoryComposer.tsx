import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import imageCompression from 'browser-image-compression';

interface StoryComposerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function StoryComposer({ onClose, onSuccess }: StoryComposerProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit() {
    if (!user || !selectedFile) return;

    setUploading(true);
    setError('');

    try {
      let fileToUpload = selectedFile;

      if (selectedFile.type.startsWith('image/')) {
        try {
          fileToUpload = await imageCompression(selectedFile, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          });
        } catch (compressionError) {
          console.error('Image compression failed, using original:', compressionError);
        }
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
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
          media_type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
          caption: caption.trim() || null
        });

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

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Create Story
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!previewUrl ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[9/16] max-h-[60vh] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">
                    Upload Photo or Video
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Stories disappear after 24 hours
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] max-h-[60vh] bg-slate-900 rounded-2xl overflow-hidden">
                {selectedFile?.type.startsWith('video/') ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                  {caption.length}/200
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-bold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Share to Story
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
