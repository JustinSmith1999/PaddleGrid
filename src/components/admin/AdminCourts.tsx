import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sortCourtsByNumber } from '../../lib/courtUtils';

interface Court {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number;
  is_active: boolean;
  image_url: string | null;
}

export function AdminCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hourly_rate: '',
    is_active: true,
    image_url: '',
  });

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      // Check if we need to update courts
      const { data: existingCourts } = await supabase
        .from('courts')
        .select('name');
      
      const hasOldCourts = existingCourts?.some(court => 
        court.name.includes('Championship') || 
        court.name.includes('Pro Indoor') || 
        court.name.includes('Outdoor Elite') ||
        court.name.includes('Training Center') ||
        court.name.includes('Outdoor Classic') ||
        court.name.includes('Recreation') ||
        court.name.includes('Tournament')
      );
      
      const needsSimpleCourts = !existingCourts || existingCourts.length !== 12 || hasOldCourts;
      
      if (needsSimpleCourts) {
        console.log('Updating courts to simple Court 1-12 format...');
        
        // Delete all existing courts
        await supabase.from('courts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Create 12 new courts with simple names
        const newCourts = [];
        for (let i = 1; i <= 12; i++) {
          newCourts.push({
            name: `Court ${i}`,
            description: 'Professional pickleball court with premium surface and lighting',
            hourly_rate: 35.00,
            is_active: true,
            image_url: 'https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg?auto=compress&cs=tinysrgb&w=800'
          });
        }
        
        const { error: insertError } = await supabase.from('courts').insert(newCourts);
        if (insertError) {
          console.error('Error creating new courts:', insertError);
          throw insertError;
        }
        
        console.log('Successfully created 12 courts: Court 1 through Court 12');
      }
      
      // Fetch the current courts
      const { data, error } = await supabase
        .from('courts')
        .select('*');

      if (error) throw error;
      setCourts(sortCourtsByNumber(data || []));
    } catch (error) {
      console.error('Error fetching courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (court?: Court) => {
    if (court) {
      setEditingCourt(court);
      setFormData({
        name: court.name,
        description: court.description || '',
        hourly_rate: court.hourly_rate.toString(),
        is_active: court.is_active,
        image_url: court.image_url || '',
      });
      setImagePreview(court.image_url || '');
    } else {
      setEditingCourt(null);
      setFormData({
        name: '',
        description: '',
        hourly_rate: '',
        is_active: true,
        image_url: '',
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('court-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('court-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const imageUrl = await uploadImage();

      const courtData = {
        name: formData.name,
        description: formData.description || null,
        hourly_rate: parseFloat(formData.hourly_rate),
        is_active: formData.is_active,
        image_url: imageUrl,
      };

      if (editingCourt) {
        const { error } = await supabase
          .from('courts')
          .update(courtData)
          .eq('id', editingCourt.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courts').insert(courtData);
        if (error) throw error;
      }

      await fetchCourts();
      closeModal();
    } catch (error) {
      console.error('Error saving court:', error);
      alert('Failed to save court');
    }
  };

  const deleteCourt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this court?')) return;

    try {
      const { error } = await supabase.from('courts').delete().eq('id', id);
      if (error) throw error;
      await fetchCourts();
    } catch (error) {
      console.error('Error deleting court:', error);
      alert('Failed to delete court');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Court Management</h2>
          <p className="text-stone-600 mt-1">Manage your facility's courts and amenities</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center font-semibold transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Court
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <div
            key={court.id}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-all"
          >
            {court.image_url && (
              <div className="h-40 overflow-hidden">
                <img
                  src={court.image_url}
                  alt={court.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-stone-800">{court.name}</h3>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    court.is_active
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  {court.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                {court.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">
                  ${court.hourly_rate}/hr
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(court)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCourt(court.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-stone-800 mb-6">
              {editingCourt ? 'Edit Court' : 'Add New Court'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Court Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g., Court 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                  placeholder="Describe the court features..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="35.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Court Image
                </label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-stone-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-stone-300 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer bg-stone-50 hover:bg-emerald-50">
                    <Upload className="w-5 h-5 text-stone-400 mr-2" />
                    <span className="text-sm font-medium text-stone-600">
                      {imageFile ? imageFile.name : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-stone-500">
                    Recommended: 800x600px, max 5MB (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium text-stone-700">
                  Active (available for booking)
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  editingCourt ? 'Update Court' : 'Create Court'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
