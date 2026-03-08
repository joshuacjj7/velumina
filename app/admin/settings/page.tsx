import ChangePasswordForm from './change-password-form'

export default function SettingsPage() {
  return (
    <div className="max-w-lg">
      <h1 className="font-semibold text-neutral-800 text-xl mb-6">Settings</h1>
      <div className="bg-white border border-neutral-100 rounded-xl p-5">
        <h2 className="font-semibold text-neutral-700 mb-4">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  )
}