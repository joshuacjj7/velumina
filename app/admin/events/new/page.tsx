import { createEvent } from '../actions'

export default function NewEventPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl text-gray-600 font-semibold mb-6">New event</h1>

      <form action={createEvent} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700">Event name</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Sarah & John's Wedding"
            className="border border-neutral-200 rounded-lg px-3 py-2 text-gray-600 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700">Slug</label>
          <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-neutral-300">
            <span className="text-neutral-400 mr-1">velumina.app/e/</span>
            <input
              name="slug"
              type="text"
              required
              placeholder="sarah-john-wedding"
              className="flex-1 focus:outline-none text-gray-600 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700">Date</label>
          <input
            name="date"
            type="date"
            className="border border-neutral-200 rounded-lg px-3 py-2 text-gray-600 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="A short description of the event..."
            className="border border-neutral-200 rounded-lg px-3 py-2 text-gray-600 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
          />
        </div>

        <button
          type="submit"
          className="bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-neutral-700 transition mt-2"
        >
          Create event
        </button>
      </form>
    </div>
  )
}