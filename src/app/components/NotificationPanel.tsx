import { useState, useEffect } from 'react';
import { X, Bell, Send, Calendar, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'reminder' | 'sent' | 'scheduled';
  patientName: string;
  patientEmail: string;
  appointmentDate: Date;
  appointmentTime: string;
  serviceName: string;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'sent'>('upcoming');

  // Get upcoming appointments (for next day reminders)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Mock notifications for appointments tomorrow
    const upcomingNotifications: Notification[] = [
      {
        id: 'n1',
        type: 'scheduled',
        patientName: 'Emma Wilson',
        patientEmail: 'emma.wilson@email.com',
        appointmentDate: tomorrow,
        appointmentTime: '09:00',
        serviceName: 'Facial Treatment',
        status: 'pending',
      },
      {
        id: 'n2',
        type: 'scheduled',
        patientName: 'Sophia Davis',
        patientEmail: 'sophia.davis@email.com',
        appointmentDate: tomorrow,
        appointmentTime: '14:00',
        serviceName: 'Botox Injection',
        status: 'pending',
      },
    ];

    const sentNotifications: Notification[] = [
      {
        id: 'n3',
        type: 'sent',
        patientName: 'Olivia Brown',
        patientEmail: 'olivia.brown@email.com',
        appointmentDate: new Date(),
        appointmentTime: '10:30',
        serviceName: 'Laser Hair Removal',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'sent',
      },
    ];

    setNotifications([...upcomingNotifications, ...sentNotifications]);
  }, []);

  const handleSendNotification = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id
          ? { ...n, status: 'sent' as const, sentAt: new Date(), type: 'sent' as const }
          : n
      )
    );
    
    toast.success(`Reminder sent to ${notification.patientName}`, {
      description: `Email sent to ${notification.patientEmail}`,
    });
  };

  const handleSendAllNotifications = () => {
    const pendingNotifications = notifications.filter(n => n.status === 'pending');
    
    setNotifications(prev =>
      prev.map(n =>
        n.status === 'pending'
          ? { ...n, status: 'sent' as const, sentAt: new Date(), type: 'sent' as const }
          : n
      )
    );

    toast.success(`${pendingNotifications.length} reminders sent`, {
      description: 'All patients have been notified',
    });
  };

  const upcomingNotifications = notifications.filter(n => n.status === 'pending');
  const sentNotifications = notifications.filter(n => n.status === 'sent');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center md:justify-end z-50 p-0 md:p-4">
      <div className="bg-white w-full md:w-[480px] md:max-h-[90vh] h-full md:h-auto md:rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between md:rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Bell className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">Appointment reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            Upcoming ({upcomingNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'sent'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            Sent ({sentNotifications.length})
          </button>
        </div>

        {/* Send All Button */}
        {activeTab === 'upcoming' && upcomingNotifications.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleSendAllNotifications}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Send className="w-5 h-5" />
              Send All Reminders ({upcomingNotifications.length})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No upcoming reminders</p>
                </div>
              ) : (
                upcomingNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onSend={handleSendNotification}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sentNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No sent notifications</p>
                </div>
              ) : (
                sentNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onSend?: (notification: Notification) => void;
}

function NotificationCard({ notification, onSend }: NotificationCardProps) {
  const isSent = notification.status === 'sent';

  return (
    <div className={`p-4 rounded-lg border-2 ${
      isSent ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">{notification.patientName}</h3>
          </div>
          <p className="text-sm text-gray-600">{notification.patientEmail}</p>
        </div>
        {isSent && (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>
            {notification.appointmentDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })} at {notification.appointmentTime}
          </span>
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium">Service:</span> {notification.serviceName}
        </div>
      </div>

      {isSent && notification.sentAt && (
        <p className="text-xs text-gray-600">
          Sent {notification.sentAt.toLocaleDateString()} at{' '}
          {notification.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {!isSent && onSend && (
        <button
          onClick={() => onSend(notification)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Send className="w-4 h-4" />
          Send Reminder
        </button>
      )}
    </div>
  );
}
