import { useState, useEffect } from 'react';
import { Info, Save } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '../../lib/services/settingsService';

export default function SettingsView() {
  const [reminderDays, setReminderDays] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.get().then((s) => setReminderDays(s.reminderDaysBefore)).catch(() => {});
  }, []);

  const saveReminderDays = () => {
    setSaving(true);
    settingsService.update({ reminderDaysBefore: reminderDays })
      .then(() => toast.success('Settings saved'))
      .catch(() => toast.error('Failed to save'))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">System configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Appointment reminders</h3>
        <p className="text-sm text-gray-600 mb-4">How many days before an appointment to send reminder (email; SMS/WhatsApp can be enabled when drivers are configured). Reminders are also sent automatically daily at 09:00 via the scheduler (<code className="text-xs bg-gray-100 px-1">php artisan reminders:send</code>).</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={14}
            value={reminderDays}
            onChange={(e) => setReminderDays(Number(e.target.value) || 1)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-20"
          />
          <span className="text-sm text-gray-600">day(s) before</span>
          <button
            disabled={saving}
            onClick={saveReminderDays}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg text-blue-900 mb-2">Permissions Moved to User Management</h3>
            <p className="text-blue-800 mb-4">
              Tab visibility and permissions are now managed on a per-user basis. You can configure what each user can access by going to the <strong>Users</strong> tab.
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-700 mb-2"><strong>How it works:</strong></p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Each user has their own permission settings</li>
                <li>Admins can control which tabs each user sees</li>
                <li>Permissions include: Calendar, Patients, Doctors, Services, Users, and Settings</li>
                <li>Changes apply immediately after user logs in</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
