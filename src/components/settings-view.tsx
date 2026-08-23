"use client";

import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserState } from "@/components/user-state-provider";
import { exportLocalState } from "@/lib/local-state";

export function SettingsView({ categories }: { categories: readonly string[] }) {
  const { state, update, toggleFavoriteCategory, reset } = useUserState();
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="content-card">
        <CardHeader><CardTitle>Quote preferences</CardTitle><CardDescription className="text-white/50">Shape the feed without losing the purple-first experience.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="profanity">Hide profanity</Label><p className="mt-1 text-xs text-white/45">Enabled by default.</p></div><Switch id="profanity" checked={state.hideProfanity} onCheckedChange={(checked) => update({ hideProfanity: checked })} /></div>
          <div className="space-y-2"><Label htmlFor="feed-scope">Feed scope</Label><Select value={state.feedScope} onValueChange={(value: "all" | "favorite-topics") => update({ feedScope: value })}><SelectTrigger id="feed-scope" className="w-full border-white/15 bg-white/5"><SelectValue /></SelectTrigger><SelectContent className="border-white/15 bg-black text-white"><SelectItem value="all">All verified quotes</SelectItem><SelectItem value="favorite-topics">Favorite topics</SelectItem></SelectContent></Select></div>
          <div><Label>Favorite topics</Label><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.map((category) => <label key={category} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs"><Checkbox checked={state.favoriteCategories.includes(category)} onCheckedChange={() => toggleFavoriteCategory(category)} /><span>{category}</span></label>)}</div></div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card className="content-card">
          <CardHeader><CardTitle>Your data</CardTitle><CardDescription className="text-white/50">Saved quotes and preferences live only in this browser.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black" onClick={() => exportLocalState(state)}><Download />Export data</Button>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><RotateCcw />Reset app</Button></AlertDialogTrigger><AlertDialogContent className="border-white/15 bg-black text-white"><AlertDialogHeader><AlertDialogTitle>Reset all local data?</AlertDialogTitle><AlertDialogDescription className="text-white/55">This removes saved quotes, preferences, and onboarding state from this browser. It cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-white/15 bg-white/5 text-white">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { reset(); toast.success("Local data reset"); }} className="bg-[var(--destructive)] text-white">Reset</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </CardContent>
        </Card>
        <Card className="content-card">
          <CardHeader><CardTitle>About and policies</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/disclaimer">Disclaimer</Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/privacy">Privacy</Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/terms">Terms</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
