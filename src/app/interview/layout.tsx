import "./interview.css";
import { SectionGate } from "@/components/SectionGate";

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return <SectionGate section="interview">{children}</SectionGate>;
}
