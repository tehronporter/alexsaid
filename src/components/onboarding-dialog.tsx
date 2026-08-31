"use client";

import { Button } from "@/components/ui/button";
import { ProductIcon } from "@/components/product-icon";
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
          <SheetTitle className="text-xl text-white">One idea at a time.</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-white/65">Browse with the visible Previous and Next controls anytime. On mobile, you can also swipe up for the next quote or down to go back.</SheetDescription>
        </SheetHeader>
        <div className="mx-4 grid grid-cols-2 gap-3 border-y border-white/12 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white/82">
          <div className="flex items-center gap-2"><ProductIcon name="previous" />Previous</div>
          <div className="flex items-center justify-end gap-2">Next<ProductIcon name="next" /></div>
        </div>
        <SheetFooter className="flex-row items-center justify-between pb-6">
          <Button variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={close}>Skip</Button>
          <Button className="bg-white text-black hover:bg-white/90" onClick={close}>Start browsing</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
