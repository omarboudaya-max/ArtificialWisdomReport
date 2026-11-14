import { PageHeader } from "@/components/ui/Badges";
import { SystemForm } from "@/components/app/SystemForm";
import { createSystem } from "../../actions";

export const metadata = { title: "Register AI system" };

export default function NewSystem() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="AI System Discovery" title="Register an AI system" subtitle="Profile the system so the platform can determine applicable regulations, test suites and risk tier." />
      <SystemForm action={createSystem} submit="Register system" />
    </div>
  );
}
