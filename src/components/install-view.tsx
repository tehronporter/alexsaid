"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bell, Check, Download, Share, Smartphone, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { pushEnabled } from "@/lib/push";
import { trackProductEvent } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }>; }

function subscribeDisplayMode(listener: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function subscribeEnvironment() { return () => undefined; }

export function InstallView() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const displayModeInstalled = useSyncExternalStore(subscribeDisplayMode, () => window.matchMedia("(display-mode: standalone)").matches, () => false);
  const isIOS = useSyncExternalStore(subscribeEnvironment, () => /iphone|ipad|ipod/i.test(navigator.userAgent), () => false);
  const [installedByEvent, setInstalledByEvent] = useState(false);
  const installed = displayModeInstalled || installedByEvent;
  useEffect(() => {
    const handlePrompt = (event: Event) => { event.preventDefault(); setPromptEvent(event as BeforeInstallPromptEvent); };
    const handleInstalled = () => { setInstalledByEvent(true); trackProductEvent("pwa_installed"); };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    trackProductEvent("install_viewed");
    return () => { window.removeEventListener("beforeinstallprompt", handlePrompt); window.removeEventListener("appinstalled", handleInstalled); };
  }, []);
  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalledByEvent(true);
    setPromptEvent(null);
  }, [promptEvent]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="content-card overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-[var(--purple)] p-7"><span className="mb-6 grid size-16 place-items-center rounded-2xl bg-black text-4xl">“</span><CardTitle className="display-type text-5xl uppercase">Put useful ideas one tap away.</CardTitle><CardDescription className="text-white/70">Install Hormozi Said for a focused, full-screen experience.</CardDescription></CardHeader>
        <CardContent className="space-y-4 p-6">
          {[{ icon: Smartphone, text: "Launches like an app from your Home Screen" }, { icon: WifiOff, text: "Keeps the core quote experience available offline" }, ...(pushEnabled ? [{ icon: Bell, text: "Ready for daily Web Push when delivery is activated" }] : [])].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/10"><Icon className="size-4" /></span><span className="text-sm">{text}</span></div>)}
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card className="content-card"><CardHeader><CardTitle>{installed ? "Already installed" : isIOS ? "Install on iPhone or iPad" : "Install this app"}</CardTitle></CardHeader><CardContent className="space-y-4">{installed ? <div className="flex items-center gap-3 text-sm"><span className="grid size-9 place-items-center rounded-full bg-white text-black"><Check /></span>You’re using the standalone app.</div> : isIOS ? <ol className="space-y-4 text-sm text-white/70"><li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">1</span>Open this page in Safari.</li><li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">2</span>Tap the <Share className="mx-1 inline size-4" /> Share button.</li><li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">3</span>Choose “Add to Home Screen.”</li></ol> : promptEvent ? <Button className="w-full bg-white text-black hover:bg-white/90" onClick={install}><Download />Install Hormozi Said</Button> : <p className="text-sm leading-relaxed text-white/55">Use your browser menu and choose “Install app” or “Add to Home Screen.”</p>}</CardContent></Card>
        {pushEnabled ? <>
          <Alert className="border-white/15 bg-black text-white"><Bell /><AlertTitle>Daily notifications are not active yet.</AlertTitle><AlertDescription className="text-white/60">Delivery setup is available after you opt in.</AlertDescription></Alert>
          <Button variant="outline" className="w-full border-white/15 bg-black text-white hover:bg-white hover:text-black" onClick={() => trackProductEvent("notification_interest")}>Notify me daily</Button>
        </> : null}
      </div>
    </div>
  );
}
