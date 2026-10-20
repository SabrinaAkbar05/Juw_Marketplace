import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Building2, Plus, Trash2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/common/Button';
import { useMarketplace } from '../../context/MarketplaceContext';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useAdmin();
  const { addToast } = useMarketplace();

  const [marketplaceName, setMarketplaceName] = useState(settings.marketplaceName);
  const [commissionRate, setCommissionRate] = useState(settings.commissionRate.toString());
  const [bannerAnnouncement, setBannerAnnouncement] = useState(settings.bannerAnnouncement);
  const [pickupLocations, setPickupLocations] = useState<string[]>(settings.campusPickupLocations);
  const [newLocationInput, setNewLocationInput] = useState('');

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocationInput.trim()) {
      setPickupLocations([...pickupLocations, newLocationInput.trim()]);
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (index: number) => {
    setPickupLocations(pickupLocations.filter((_, i) => i !== index));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      marketplaceName,
      commissionRate: Number(commissionRate),
      bannerAnnouncement,
      campusPickupLocations: pickupLocations,
    });
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'JUW Marketplace global configuration updated successfully.',
    });
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
          Global Marketplace Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Adjust university platform fee policies, manage on-campus pickup collection hubs, and update site announcements.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Settings Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-5">
          <h2 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
            Platform Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Marketplace Title
              </label>
              <input
                type="text"
                value={marketplaceName}
                onChange={(e) => setMarketplaceName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                University Incubation Commission (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                95% goes directly to student creator; 5% sustains packaging and campus dispatch.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Public Top Announcement Bar
            </label>
            <input
              type="text"
              value={bannerAnnouncement}
              onChange={(e) => setBannerAnnouncement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Campus Pickup Hubs Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-5">
          <h2 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
            On-Campus Pickup & Fulfillment Stations
          </h2>

          <div className="space-y-2.5">
            {pickupLocations.map((loc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <span className="font-semibold text-slate-900">{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add new campus pickup station (e.g. Block E Chemistry Reception)..."
              value={newLocationInput}
              onChange={(e) => setNewLocationInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLocation}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Location
            </Button>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="emerald"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
