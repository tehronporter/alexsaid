"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserState } from "@/components/user-state-provider";

export function OnboardingDialog() {
  const { state, update } = useUserState();
  const close = () => update({ onboardingComplete: true });
  return (
    <Sheet open={!state.onboardingComplete} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="bottom" showCloseButton={false} className="border-t border-white/18 bg-black text-white shadow-[var(--shadow-overlay)] sm:mx-auto sm:max-w-md sm:rounded-t-[20px]">
        <SheetHeader className="pt-6">
          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.17em] text-[var(--purple-light)]">A focused quote library</p>
          <SheetTitle className="text-xl text-white">Keep the ideas worth returning to.</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-white/65">Swipe for another quote. Save what matters. Open the source whenever you want the full context.</SheetDescription>
        </SheetHeader>
        <SheetFooter className="flex-row items-center justify-between pb-6">
          <Button variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={close}>Skip</Button>
          <Button className="bg-white text-black hover:bg-white/90" onClick={close}>Got it</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
