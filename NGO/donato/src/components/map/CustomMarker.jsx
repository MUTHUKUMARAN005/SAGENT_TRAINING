// src/components/map/CustomMarker.jsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiExternalLink, FiCheckCircle, FiStar } from 'react-icons/fi';

const NGO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&auto=format&fit=crop';

const createCustomIcon = (color = '#3b82f6', emoji = '📍', size = 40) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.3);
        ">
          <span style="transform: rotate(45deg); font-size: ${size * 0.4}px;">${emoji}</span>
        </div>
      </div>
    `,
  });
};

// NGO Marker
export const NGOMarker = ({ ngo }) => {
  const getCategoryColor = (category) => {
    const colors = {
      education: '#8b5cf6',
      food: '#f97316',
      healthcare: '#ef4444',
      water: '#06b6d4',
      disaster_relief: '#dc2626',
      clothing: '#14b8a6',
      environment: '#22c55e',
      women: '#ec4899',
      children: '#a855f7',
      rural: '#eab308',
    };
    return colors[category] || '#3b82f6';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      education: '📚',
      food: '🍲',
      healthcare: '🏥',
      water: '💧',
      disaster_relief: '🆘',
      clothing: '👕',
      environment: '🌿',
      women: '👩',
      children: '👶',
      rural: '🏘️',
    };
    return emojis[category] || '🏢';
  };

  return (
    <Marker
      position={[ngo.lat, ngo.lng]}
      icon={createCustomIcon(
        getCategoryColor(ngo.category),
        getCategoryEmoji(ngo.category)
      )}
    >
      <Popup maxWidth={320} minWidth={280}>
        <div className="p-0">
          {/* Image */}
          <div className="relative h-32 overflow-hidden rounded-t-xl">
            <img
              src={ngo.image}
              alt={ngo.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = NGO_FALLBACK_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent" />
            {ngo.verified && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 
                            rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30">
                <FiCheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">Verified</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 bg-[#1e293b]">
            <h3 className="text-white font-semibold text-sm mb-1">{ngo.name}</h3>
            
            <div className="flex items-center gap-1 mb-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(ngo.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 ml-1">{ngo.rating}</span>
            </div>

            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{ngo.description}</p>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiMapPin className="w-3 h-3 text-primary-400 shrink-0" />
                <span className="truncate">{ngo.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiPhone className="w-3 h-3 text-primary-400 shrink-0" />
                <span>{ngo.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiMail className="w-3 h-3 text-primary-400 shrink-0" />
                <span className="truncate">{ngo.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-white font-bold text-sm">{ngo.activeCampaigns}</p>
                <p className="text-[10px] text-slate-500">Active Campaigns</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-white font-bold text-sm">{ngo.totalDonations}</p>
                <p className="text-[10px] text-slate-500">Total Raised</p>
              </div>
            </div>

            <Link
              to={`/campaigns?ngo=${ngo.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-primary-600 
                       text-white rounded-lg text-xs font-medium hover:bg-primary-500 
                       transition-colors"
            >
              View Campaigns
              <FiExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Pickup Center Marker
export const PickupMarker = ({ location }) => {
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={createCustomIcon('#f97316', '📦', 36)}
    >
      <Popup maxWidth={280}>
        <div className="p-4 bg-[#1e293b]">
          <h3 className="text-white font-semibold text-sm mb-2">{location.name}</h3>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FiMapPin className="w-3 h-3 text-orange-400 shrink-0" />
              <span>{location.address}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-orange-400">🕐</span>
              <span>{location.timing}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FiPhone className="w-3 h-3 text-orange-400 shrink-0" />
              <span>{location.phone}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1.5">Accepted Items:</p>
            <div className="flex flex-wrap gap-1">
              {location.acceptedItems.map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 
                           text-[10px] capitalize"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Campaign Location Marker
export const CampaignMarker = ({ campaign }) => {
  return (
    <Marker
      position={[campaign.lat, campaign.lng]}
      icon={createCustomIcon('#22c55e', '🎯', 36)}
    >
      <Popup maxWidth={260}>
        <div className="p-4 bg-[#1e293b]">
          <h3 className="text-white font-semibold text-xs mb-1">{campaign.title}</h3>
          <p className="text-[10px] text-slate-400 mb-2">{campaign.city}</p>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-white font-bold text-sm">{campaign.beneficiaries}</p>
              <p className="text-[10px] text-slate-500">Beneficiaries</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 
                         text-[10px] capitalize">
              {campaign.status}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export { createCustomIcon };
export default NGOMarker;
