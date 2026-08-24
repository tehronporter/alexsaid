"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import type { Quote } from "@/domain/catalog";
import { EditorialSection } from "@/components/editorial";
import { ProductIcon } from "@/components/product-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserState } from "@/components/user-state-provider";
import { exportLocalState } from "@/lib/local-state";
import { cn } from "@/lib/utils";
import { useOptionalCatalog } from "@/components/catalog-provider";

const EMPTY_CATEGORIES: readonly string[] = [];
const EMPTY_QUOTES: readonly Quote[] = [];

export function SettingsView({ categories: suppliedCategories, quotes: suppliedQuotes }: { categories?: readonly string[]; quotes?: readonly Quote[] }) {
  const catalogContext = useOptionalCatalog();
  const categories = suppliedCategories ?? catalogContext?.catalog?.categories ?? EMPTY_CATEGORIES;
  const quotes = suppliedQuotes ?? catalogContext?.catalog?.quotes ?? EMPTY_QUOTES;
  const { state, update, toggleFavoriteCategory, reset } = useUserState();
  const populatedCategories = useMemo(() => categories.filter((category) => quotes.some((quote) => quote.primaryCategory === category)), [categories, quotes]);
  const selectedCount = state.favoriteCategories.length;

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-12">
        <EditorialSection title="Quote preferences">
          <div className="flex items-center justify-between gap-6 py-3">
            <div><Label htmlFor="profanity" className="text-sm font-semibold">Hide profanity</Label><p className="mt-1 text-xs text-white/58">Enabled by default.</p></div>
            <Switch id="profanity" checked={state.hideProfanity} onCheckedChange={(checked) => update({ hideProfanity: checked })} className="data-checked:bg-[var(--purple)]" />
          </div>
        </EditorialSection>

        <EditorialSection title="Feed scope">
          <div className="grid grid-cols-2 border-y border-white/14">
            {([['all', 'All quotes'], ['favorite-topics', 'Favorite topics']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={state.feedScope === value}
                disabled={value === "favorite-topics" && selectedCount === 0}
                onClick={() => update({ feedScope: value })}
                className={cn("min-h-12 border-b-2 border-transparent px-3 text-sm font-semibold text-white/58 transition-colors duration-150 hover:text-white disabled:pointer-events-none disabled:opacity-35", state.feedScope === value && "border-[var(--purple-light)] text-white")}
              >{label}</button>
            ))}
          </div>
          {selectedCount === 0 ? <p className="mt-3 text-xs text-white/58">Choose a favorite topic to enable the focused feed.</p> : null}
        </EditorialSection>
      </div>

      <div className="space-y-12">
        <EditorialSection title="Favorite topics" meta={`${selectedCount} selected`}>
          <div className="grid sm:grid-cols-2">
            {populatedCategories.map((category) => (
              <label key={category} className="flex min-h-12 cursor-pointer items-center gap-3 border-t border-white/12 py-3 first:border-t-0 sm:px-1 sm:[&:nth-child(2)]:border-t-0">
                <Checkbox checked={state.favoriteCategories.includes(category)} onCheckedChange={() => toggleFavoriteCategory(category)} className="data-checked:border-[var(--purple-light)] data-checked:bg-[var(--purple)]" />
                <span className="text-sm text-white/82">{category}</span>
              </label>
            ))}
          </div>
        </EditorialSection>

        <EditorialSection title="Your data">
          <p className="max-w-md text-sm leading-relaxed text-white/60">Saved quotes and preferences live only in this browser.</p>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button variant="outline" className="border-white/22 bg-transparent text-white hover:bg-white hover:text-black" onClick={() => exportLocalState(state)}><ProductIcon name="download" />Export data</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><button type="button" className="min-h-11 px-2 text-sm font-semibold text-red-300 underline decoration-red-300/40 underline-offset-4 hover:text-red-200">Reset all app data</button></AlertDialogTrigger>
              <AlertDialogContent className="fixed inset-x-0 bottom-0 top-auto left-0 w-full max-w-full translate-x-0 translate-y-0 rounded-t-[20px] rounded-b-none border-x-0 border-b-0 border-t border-white/18 bg-black pb-[calc(1.25rem+var(--safe-bottom))] text-white shadow-[var(--shadow-overlay)] sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px] sm:border sm:pb-4">
                <AlertDialogHeader><AlertDialogTitle>Reset all local data?</AlertDialogTitle><AlertDialogDescription className="text-white/62">This removes saved quotes, preferences, and onboarding state from this browser. It cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel className="border-white/20 bg-transparent text-white">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { reset(); toast.success("Local data reset"); }} className="bg-[var(--destructive)] text-white">Reset</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </EditorialSection>
      </div>
    </div>
  );
}
