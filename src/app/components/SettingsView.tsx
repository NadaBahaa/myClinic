import { Info } from 'lucide-react';

export default function SettingsView() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">System configuration</p>
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
