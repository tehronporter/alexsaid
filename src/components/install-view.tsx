"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { EditorialSection } from "@/components/editorial";
import { ProductIcon } from "@/components/product-icon";
import { Button } from "@/components/ui/button";
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

  const heading = installed ? "Already installed" : isIOS ? "Install on iPhone or iPad" : "Install this app";

  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <section className="relative min-h-[24rem] overflow-hidden bg-[var(--purple)] p-7 sm:p-10">
        <span className="display-type absolute -right-4 -top-20 text-[18rem] leading-none text-white/[0.08]" aria-hidden="true">”</span>
        <div className="relative flex h-full flex-col justify-between">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-white">Alex Said for your Home Screen</p>
          <div>
            <h2 className="display-type max-w-xl text-6xl uppercase leading-[0.88] sm:text-7xl">Put useful ideas one tap away.</h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/90">Launch full-screen and keep the core quote library available after it has loaded—even without a connection.</p>
          </div>
        </div>
      </section>

      <div className="space-y-12">
        <EditorialSection title="Installation">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">{heading}</h2>
          {installed ? (
            <p className="mt-5 border-l-2 border-[var(--purple-light)] pl-4 text-sm text-white/75">You’re using the standalone app.</p>
          ) : isIOS ? (
            <ol className="mt-6 border-t border-white/14">
              {["Open this page in Safari.", "Tap Safari’s Share button.", "Choose “Add to Home Screen.”"].map((step, index) => (
                <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-white/12 py-4 text-sm text-white/78"><span className="tabular-nums text-[var(--purple-light)]">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>
              ))}
            </ol>
          ) : promptEvent ? (
            <Button className="mt-6 bg-white text-black hover:bg-white/90" onClick={install}><ProductIcon name="download" />Install Alex Said</Button>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-white/62">Use your browser menu and choose “Install app” or “Add to Home Screen.”</p>
          )}
        </EditorialSection>

        <EditorialSection title="What changes">
          <ul className="border-t border-white/14 text-sm text-white/72">
            <li className="border-b border-white/12 py-4">Launch from your Home Screen without browser clutter.</li>
            <li className="border-b border-white/12 py-4">Return to previously loaded quotes when you are offline.</li>
          </ul>
        </EditorialSection>

        {pushEnabled ? <EditorialSection title="Daily notifications"><p className="text-sm text-white/62">Daily delivery is not active yet. Permission will only be requested after you choose to opt in.</p><Button variant="outline" className="mt-5 border-white/20 bg-transparent text-white hover:bg-white hover:text-black" onClick={() => trackProductEvent("notification_interest")}>Notify me daily</Button></EditorialSection> : null}
      </div>
    </div>
  );
}
