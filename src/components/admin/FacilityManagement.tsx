import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, Settings, CreditCard, Users, Plus, Save, X } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  timezone: string;
  currency: string;
  stripe_account_id: string | null;
  settings: any;
  is_active: boolean;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
}

interface FacilityUser {
  id: string;
  facility_id: string;
  user_id: string;
  role: string;
  profiles: {
    email: string;
    full_name: string;
  };
}

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [facilityUsers, setFacilityUsers] = useState<FacilityUser[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    phone: '',
    email: '',
    website: '',
    timezone: 'America/New_York',
    currency: 'usd',
    subscription_tier: 'trial' as const,
  });

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      loadFacilityUsers(selectedFacility.id);
    }
  }, [selectedFacility]);

  const loadFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFacilities(data || []);
      if (data && data.length > 0 && !selectedFacility) {
        setSelectedFacility(data[0]);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacilityUsers = async (facilityId: string) => {
    try {
      const { data, error } = await supabase
        .from('facility_users')
        .select('*, profiles(email, full_name)')
        .eq('facility_id', facilityId);

      if (error) throw error;
      setFacilityUsers(data || []);
    } catch (error) {
      console.error('Error loading facility users:', error);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedFacility(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
      phone: '',
      email: '',
      website: '',
      timezone: 'America/New_York',
      currency: 'usd',
      subscription_tier: 'trial',
    });
  };

  const handleEdit = () => {
    if (selectedFacility) {
      setIsEditing(true);
      setIsCreating(false);
      setFormData({
        name: selectedFacility.name,
        slug: selectedFacility.slug,
        description: selectedFacility.description || '',
        address: selectedFacility.address || '',
        city: selectedFacility.city || '',
        state: selectedFacility.state || '',
        zip_code: selectedFacility.zip_code || '',
        country: selectedFacility.country || 'US',
        phone: selectedFacility.phone || '',
        email: selectedFacility.email || '',
        website: selectedFacility.website || '',
        timezone: selectedFacility.timezone,
        currency: selectedFacility.currency,
        subscription_tier: selectedFacility.subscription_tier as any,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from('facilities')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('facility_users')
            .insert([{
              facility_id: data.id,
              user_id: user.id,
              role: 'owner'
            }]);
        }

        setFacilities([data, ...facilities]);
        setSelectedFacility(data);
      } else if (selectedFacility) {
        const { data, error } = await supabase
          .from('facilities')
          .update(formData)
          .eq('id', selectedFacility.id)
          .select()
          .single();

        if (error) throw error;

        setFacilities(facilities.map(f => f.id === data.id ? data : f));
        setSelectedFacility(data);
      }

      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving facility:', error);
      alert('Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facility Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your facilities and locations</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Facility
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Facilities</h2>
              <div className="space-y-2">
                {facilities.map((facility) => (
                  <div
                    key={facility.id}
                    onClick={() => {
                      setSelectedFacility(facility);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedFacility?.id === facility.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{facility.city}, {facility.state}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            facility.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {facility.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            {facility.subscription_tier}
                          </span>
                        </div>
                      </div>
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedFacility || isCreating ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {isCreating ? 'Create New Facility' : 'Facility Details'}
                  </h2>
                  {!isEditing && !isCreating && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {(isEditing || isCreating) && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing || isCreating ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facility Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL Slug *
                        </label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="usd">USD</option>
                          <option value="eur">EUR</option>
                          <option value="gbp">GBP</option>
                          <option value="cad">CAD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subscription Tier
                        </label>
                        <select
                          value={formData.subscription_tier}
                          onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="trial">Trial</option>
                          <option value="basic">Basic</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Location</h3>
                        <p className="text-gray-600 mt-1">
                          {selectedFacility.address && <>{selectedFacility.address}<br /></>}
                          {selectedFacility.city}, {selectedFacility.state} {selectedFacility.zip_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Contact</h3>
                        <p className="text-sm text-gray-600">
                          {selectedFacility.phone && <div>Phone: {selectedFacility.phone}</div>}
                          {selectedFacility.email && <div>Email: {selectedFacility.email}</div>}
                          {selectedFacility.website && (
                            <div>
                              Website: <a href={selectedFacility.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedFacility.website}
                              </a>
                            </div>
                          )}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Settings</h3>
                        <p className="text-sm text-gray-600">
                          <div>Timezone: {selectedFacility.timezone}</div>
                          <div>Currency: {selectedFacility.currency.toUpperCase()}</div>
                          <div>Tier: {selectedFacility.subscription_tier}</div>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900">Stripe Account</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            {selectedFacility.stripe_account_id
                              ? `Connected: ${selectedFacility.stripe_account_id}`
                              : 'Not connected - Set up Stripe to accept payments'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Facility Team ({facilityUsers.length})
                      </h3>
                      <div className="space-y-2">
                        {facilityUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{user.profiles.full_name}</p>
                              <p className="text-sm text-gray-600">{user.profiles.email}</p>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Facility Selected</h3>
                <p className="text-gray-600">Select a facility from the list or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
