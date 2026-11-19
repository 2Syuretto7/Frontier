import "./projects.css";
import { SectionGate } from "@/components/SectionGate";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <SectionGate section="projects">{children}</SectionGate>;
}
