import { loadSystem } from "@/lib/systems";
import { SystemForm } from "@/components/app/SystemForm";
import { deleteSystem, updateSystem } from "@/app/app/actions";

export default async function EditSystem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { system, isAdmin } = await loadSystem(id);
  return (
    <div className="max-w-3xl space-y-6">
      <SystemForm action={updateSystem} system={system} submit="Save changes" />
      {isAdmin && (
        <form action={deleteSystem} className="card flex items-center justify-between gap-4 border-red-500/20 p-5">
          <input type="hidden" name="id" value={id} />
          <div><div className="font-semibold text-red-300">Delete system</div><div className="text-xs text-ink-400">Removes the system and all assessments, findings and credentials. The audit trail keeps a record.</div></div>
          <button className="btn-danger">Delete</button>
        </form>
      )}
    </div>
  );
}
