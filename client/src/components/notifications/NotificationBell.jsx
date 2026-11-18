import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Dumbbell,
  UserCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'PASS_EXPIRING_7D':
    case 'PASS_EXPIRING_3D':
      return <Clock className="w-4 h-4 text-amber-400" />;
    case 'PASS_EXPIRED':
    case 'COACH_GRACE_PERIOD':
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    case 'PASS_RENEWED':
    case 'COACH_REQUEST_APPROVED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'COACH_REQUEST_REJECTED':
      return <XCircle className="w-4 h-4 text-rose-400" />;
    case 'WORKOUT_PLAN_ASSIGNED':
      return <Dumbbell className="w-4 h-4 text-indigo-400" />;
    case 'COACH_REQUEST_SUBMITTED':
      return <UserCheck className="w-4 h-4 text-sky-400" />;
    default:
      return <Sparkles className="w-4 h-4 text-primary-400" />;
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ autoFetch: true, pollInterval: 45000 });

  // Close popover on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      setIsOpen(false);
      navigate(notif.actionUrl);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Notifications panel"
            className="fixed inset-x-3.5 top-16 mt-1 z-50 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-h-[calc(100dvh-5.5rem)] sm:max-h-[520px] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-400 px-2 py-1 rounded transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 text-xs">
            <button
              type="button"
              onClick={() => setFilterUnread(false)}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                !filterUnread
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterUnread(true)}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                filterUnread
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Loading notifications...
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {filterUnread ? 'No unread notifications' : 'No notifications yet'}
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer ${
                    notif.isRead
                      ? 'hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                      : 'bg-slate-800/30 hover:bg-slate-800/60'
                  }`}
                >
                  {/* Icon badge */}
                  <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className={`text-xs font-semibold truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] text-slate-500 font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute right-2 top-3 flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition"
                      aria-label="Delete notification"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
      )}
    </div>
  );
}

export default NotificationBell;
