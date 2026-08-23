"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserState } from "@/components/user-state-provider";

export function OnboardingDialog() {
  const { state, update } = useUserState();
  const close = () => update({ onboardingComplete: true });
  return (
    <Sheet open={!state.onboardingComplete} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="bottom" showCloseButton={false} className="border-t border-white/15 bg-black text-white sm:mx-auto sm:max-w-md sm:rounded-t-3xl">
        <SheetHeader className="pt-6">
          <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-[var(--purple)]"><Sparkles className="size-5" /></span>
          <SheetTitle className="text-xl text-white">Business advice worth remembering.</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-white/65">Swipe for another idea, tap the bookmark to keep one, and check More for install and offline access.</SheetDescription>
        </SheetHeader>
        <SheetFooter className="flex-row items-center justify-between pb-6">
          <Button variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={close}>Skip</Button>
          <Button className="bg-white text-black hover:bg-white/90" onClick={close}>Got it</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
