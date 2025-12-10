import React, { useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePictureUploadProps {
  currentPictureUrl?: string;
  onUploadComplete?: (url: string) => void;
}

export default function ProfilePictureUpload({
  currentPictureUrl,
  onUploadComplete,
}: ProfilePictureUploadProps) {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPictureUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      if (currentPictureUrl) {
        const oldPath = currentPictureUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      await refreshProfile();
      onUploadComplete?.(publicUrl);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-12 h-12 text-gray-300" />
        )}
      </div>

      <label
        htmlFor="profile-picture-upload"
        className={`absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
          uploading ? 'opacity-100' : ''
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <div className="text-center">
            <Camera className="w-6 h-6 text-white mx-auto" />
            <span className="text-xs text-white mt-1 block">Edit</span>
          </div>
        )}
      </label>

      <input
        id="profile-picture-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}
