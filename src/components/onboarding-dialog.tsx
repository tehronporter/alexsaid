"use client";

import { useState } from "react";
import { ArrowRight, Bookmark, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserState } from "@/components/user-state-provider";

const steps = [
  { icon: Sparkles, title: "Business advice worth remembering.", body: "Start with one useful idea. Swipe when you’re ready for another." },
  { icon: Bookmark, title: "Keep what matters.", body: "Save quotes, search by topic, and always trace the idea back to its source." },
  { icon: Smartphone, title: "Take it with you.", body: "Install the app on your Home Screen for a focused, offline-ready experience." }
];

export function OnboardingDialog() {
  const { state, update } = useUserState();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const close = () => update({ onboardingComplete: true });
  return (
    <Dialog open={!state.onboardingComplete} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="border-white/15 bg-black text-white sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-[var(--purple)]"><Icon /></span>
          <DialogTitle className="text-2xl">{current.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-white/60">{current.body}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between pt-3">
          <Button variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white" onClick={close}>Skip</Button>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={step + 1}
            aria-valuetext={`Step ${step + 1} of ${steps.length}`}
          >
            {steps.map((item, index) => <span key={item.title} className={`h-1.5 rounded-full ${index === step ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />)}
          </div>
          <Button className="bg-white text-black hover:bg-white/90" onClick={() => step === steps.length - 1 ? close() : setStep((value) => value + 1)}>
            {step === steps.length - 1 ? "Start" : "Next"}<ArrowRight />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
