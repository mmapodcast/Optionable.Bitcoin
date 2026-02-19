

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ClockIcon } from '../components/icons/ClockIcon';
import { defaultInfoContent } from '../types';

// Helper to format remaining time
const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return "00:00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const InfoSettings: React.FC = () => {
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const storedInfo = localStorage.getItem('infoContent');
        setContent(storedInfo || defaultInfoContent);
    }, []);

    const handleSave = () => {
        if (content.trim() === '') {
            if (!window.confirm("Are you sure you want to save empty content? This will clear the current information.")) {
                return; // User cancelled
            }
        }
        localStorage.setItem('infoContent', content);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // Show "Saved!" message for 2s
    };

    return (
        <div className="border border-slate-700 rounded-lg p-4 space-y-3 bg-slate-800/50 mb-6">
            <h3 className="font-semibold text-lg text-white">'How to Use' Information</h3>
            <p className="text-sm text-slate-400">This content will be shown to users when they click the help icon.</p>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter instructions and information for your users here..."
            />
            <div className="flex justify-end items-center gap-4">
                {saved && <span className="text-green-400 text-sm transition-opacity duration-300">Saved successfully!</span>}
                <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Save Info
                </button>
            </div>
        </div>
    );
};

const AdSettingsForm: React.FC<{ adType: 'topAd' | 'bottomAd', title: string }> = ({ adType, title }) => {
    // state for inputs
    const [width, setWidth] = useState('728');
    const [height, setHeight] = useState('90');
    const [days, setDays] = useState('0');
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('0');
    const [imageData, setImageData] = useState<string | null>(null);
    const [adUrl, setAdUrl] = useState('');

    // state for countdown
    const [endTime, setEndTime] = useState<number | null>(null);
    const [remainingTime, setRemainingTime] = useState("00:00:00:00");

    // Load initial state from localStorage
    useEffect(() => {
        try {
            const storedSettings = JSON.parse(localStorage.getItem('adSettings') || '{}');
            const adConfig = storedSettings[adType];
            if (adConfig) {
                setWidth(String(adConfig.width || '728'));
                setHeight(String(adConfig.height || '90'));
                setEndTime(adConfig.endTime || null);
                setImageData(adConfig.imageData || null);
                setAdUrl(adConfig.adUrl || '');
            }
        } catch (e) {
            console.error('Failed to load ad settings', e);
        }
    }, [adType]);

    // Countdown timer effect
    useEffect(() => {
        if (!endTime || endTime <= Date.now()) {
            setRemainingTime("00:00:00:00");
            return;
        }

        const intervalId = setInterval(() => {
            const now = Date.now();
            const timeLeft = endTime - now;

            if (timeLeft <= 0) {
                setRemainingTime("00:00:00:00");
                setEndTime(null); // Stop the countdown
                clearInterval(intervalId);
            } else {
                setRemainingTime(formatRemainingTime(timeLeft));
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [endTime]);

    const handleSave = () => {
        const durationDays = parseInt(days, 10) || 0;
        const durationHours = parseInt(hours, 10) || 0;
        const durationMinutes = parseInt(minutes, 10) || 0;

        const totalMilliseconds = (durationDays * 86400 + durationHours * 3600 + durationMinutes * 60) * 1000;
        
        const newWidth = parseInt(width, 10) || 728;
        const newHeight = parseInt(height, 10) || 90;
        const newEndTime = totalMilliseconds > 0 ? Date.now() + totalMilliseconds : endTime;

        if (totalMilliseconds <= 0 && endTime === null) {
            alert("Please set a duration greater than 0 to activate a new ad.");
            return;
        }

        try {
            const storedSettings = JSON.parse(localStorage.getItem('adSettings') || '{}');
            const newSettings = {
                ...storedSettings,
                [adType]: {
                    width: newWidth,
                    height: newHeight,
                    endTime: newEndTime,
                    imageData: imageData,
                    adUrl: adUrl.trim() || null,
                    code: `placeholder for ${adType}` // Placeholder for AdSense code
                }
            };
            localStorage.setItem('adSettings', JSON.stringify(newSettings));
            setEndTime(newEndTime);
            
            // Reset duration inputs
            setDays('0');
            setHours('0');
            setMinutes('0');
        } catch (e) {
            console.error('Failed to save ad settings', e);
            alert('Error saving settings.');
        }
    };
    
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageData(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageData(null);
    };

    return (
        <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-800/50">
            <h3 className="font-semibold text-lg text-white">{title}</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`${adType}-width`} className="text-sm text-slate-400 block mb-1">Width (px)</label>
                    <input id={`${adType}-width`} type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor={`${adType}-height`} className="text-sm text-slate-400 block mb-1">Height (px)</label>
                    <input id={`${adType}-height`} type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            <div>
                <label htmlFor={`${adType}-adUrl`} className="text-sm text-slate-400 block mb-1">Link URL (Optional)</label>
                <input 
                    id={`${adType}-adUrl`} 
                    type="url" 
                    value={adUrl} 
                    onChange={e => setAdUrl(e.target.value)} 
                    placeholder="https://example.com"
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div>
                 <label className="text-sm text-slate-400 block mb-1">Set Ad Duration</label>
                 <div className="grid grid-cols-3 gap-2">
                     <input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder="Days" title="Days" className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                     <input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="Hours" title="Hours" className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                     <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="Mins" title="Minutes" className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                 </div>
            </div>

             <div>
                <label className="text-sm text-slate-400 block mb-1">Banner Image (Optional)</label>
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        id={`${adType}-image-upload`}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleImageUpload}
                    />
                    <label
                        htmlFor={`${adType}-image-upload`}
                        className="cursor-pointer bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                        Choose Image
                    </label>
                    {imageData && (
                        <button onClick={handleRemoveImage} className="text-red-400 hover:text-red-500 text-sm font-semibold">
                            Remove
                        </button>
                    )}
                </div>
                {imageData && (
                    <div className="mt-4 border border-slate-600 rounded-md p-2 bg-slate-900/50">
                        <p className="text-xs text-slate-500 mb-2">Image Preview:</p>
                        <img src={imageData} alt="Ad banner preview" className="max-w-full h-auto rounded" style={{ maxHeight: '100px' }} />
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <ClockIcon className="w-5 h-5"/>
                    <span>Time Remaining:</span>
                </div>
                <span className="font-mono text-lg font-bold text-amber-400 tracking-wider">{remainingTime}</span>
            </div>

            <button onClick={handleSave} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                Save and Activate
            </button>
        </div>
    );
};

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, login, logout } = useAuth();
  
  const [email, setEmail] = useState('admin@optionable.crypto');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      setPassword('');
    } catch (err) {
      setError((err as Error).message || 'Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuthenticated ? (
          <>
            <div>
              <h2 className="text-center text-2xl font-semibold text-white">Admin Login</h2>
              <p className="mt-2 text-center text-sm text-slate-400">Enter password to manage site settings.</p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <input type="hidden" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div>
                <label htmlFor="admin-password" className="sr-only">Password</label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="appearance-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-md text-sm" role="alert">
                  <p>{error}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex justify-center py-3 px-4 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Admin Panel</h2>
                <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors"
                >
                    Logout
                </button>
            </div>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <InfoSettings />
                <AdSettingsForm adType="topAd" title="Top Banner Ad" />
                <AdSettingsForm adType="bottomAd" title="Bottom Banner Ad" />
            </div>
             <div className="mt-6 text-right">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600"
                >
                  Close Panel
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};