import type { Metadata } from "next";
import { InstallView } from "@/components/install-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Install", description: "Install Hormozi Said as an offline-ready Home Screen app." };
export default function InstallPage() { return <main className="page-wrap"><PageHeader eyebrow="One tap away" title="Install" description="A focused Home Screen experience—without an App Store download." /><InstallView /></main>; }
