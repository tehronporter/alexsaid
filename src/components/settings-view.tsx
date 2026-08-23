"use client";

import { useMemo } from "react";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { Quote } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserState } from "@/components/user-state-provider";
import { exportLocalState } from "@/lib/local-state";

export function SettingsView({ categories, quotes }: { categories: readonly string[]; quotes: readonly Quote[] }) {
  const { state, update, toggleFavoriteCategory, reset } = useUserState();
  const populatedCategories = useMemo(() => categories.filter((category) => quotes.some((quote) => quote.primaryCategory === category)), [categories, quotes]);
  const selectedCount = state.favoriteCategories.length;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card className="content-card">
        <CardHeader><CardTitle>Quote preferences</CardTitle><CardDescription className="text-white/60">Shape the feed without losing the purple-first experience.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="profanity">Hide profanity</Label><p className="mt-1 text-xs text-white/60">Enabled by default.</p></div><Switch id="profanity" checked={state.hideProfanity} onCheckedChange={(checked) => update({ hideProfanity: checked })} /></div>
          <div className="space-y-2">
            <Label htmlFor="feed-scope">Feed scope</Label>
            <Select value={state.feedScope} onValueChange={(value: "all" | "favorite-topics") => update({ feedScope: value })}><SelectTrigger id="feed-scope" className="w-full border-white/15 bg-white/5"><SelectValue /></SelectTrigger><SelectContent className="border-white/15 bg-black text-white"><SelectItem value="all">All quotes</SelectItem><SelectItem value="favorite-topics" disabled={selectedCount === 0}>Favorite topics</SelectItem></SelectContent></Select>
            {selectedCount === 0 ? <p className="text-xs text-white/60">Pick at least one favorite topic below to enable this.</p> : null}
          </div>
          <div>
            <div className="flex items-center justify-between"><Label>Favorite topics</Label><span className="text-xs text-white/60">{selectedCount} selected</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{populatedCategories.map((category) => <label key={category} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs"><Checkbox checked={state.favoriteCategories.includes(category)} onCheckedChange={() => toggleFavoriteCategory(category)} /><span>{category}</span></label>)}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="content-card">
        <CardHeader><CardTitle>Your data</CardTitle><CardDescription className="text-white/60">Saved quotes and preferences live only in this browser.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black" onClick={() => exportLocalState(state)}><Download />Export data</Button>
          <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><RotateCcw />Reset app</Button></AlertDialogTrigger><AlertDialogContent className="border-white/15 bg-black text-white"><AlertDialogHeader><AlertDialogTitle>Reset all local data?</AlertDialogTitle><AlertDialogDescription className="text-white/60">This removes saved quotes, preferences, and onboarding state from this browser. It cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-white/15 bg-white/5 text-white">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { reset(); toast.success("Local data reset"); }} className="bg-[var(--destructive)] text-white">Reset</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
