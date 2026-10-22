'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  HelpCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

export default function NotificationModal({ isOpen, onClose, onNotificationRead }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchNotifications();
      if (onNotificationRead) onNotificationRead();
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onNotificationRead) onNotificationRead();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-unand-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold-300" />
            <h3 className="font-semibold text-base text-white">Pusat Notifikasi</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-200 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-1 rounded transition"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai Dibaca
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Memuat notifikasi...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-medium">Tidak ada notifikasi baru</p>
              <p className="text-xs text-slate-400 mt-1">Semua pemantauan studi berada dalam status terkini.</p>
            </div>
          ) : (
            notifications.map((item) => {
              let icon = <Info className="w-4 h-4 text-sky-600 mt-0.5" />;
              let borderClass = 'border-slate-100';

              if (item.type === 'assistance_request') {
                icon = <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />;
                borderClass = 'border-red-200 bg-red-50/30';
              } else if (item.type === 'overdue') {
                icon = <Clock className="w-4 h-4 text-amber-600 mt-0.5" />;
                borderClass = 'border-amber-200 bg-amber-50/30';
              }

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 pb-1 flex items-start gap-3 rounded-lg p-2.5 transition ${
                    !item.isRead ? `${borderClass} border` : 'opacity-75'
                  }`}
                >
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold ${
                          !item.isRead ? 'text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                      <div className="flex items-center gap-2">
                        {item.linkUrl && (
                          <Link
                            href={item.linkUrl}
                            onClick={onClose}
                            className="text-unand-700 hover:text-unand-900 font-medium flex items-center gap-1"
                          >
                            Buka <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {!item.isRead && (
                          <button
                            onClick={() => markSingleAsRead(item.id)}
                            className="hover:text-slate-600 text-slate-400"
                          >
                            Tandai dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-slate-50 text-[11px] text-slate-500 text-center">
          Notifikasi mencakup jadwal pelaporan, keterlambatan target, dan permintaan bantuan prodi.
        </div>
      </div>
    </div>
  );
}
