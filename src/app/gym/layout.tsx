import { SectionGate } from "@/components/SectionGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SectionGate section="gym">{children}</SectionGate>;
}
