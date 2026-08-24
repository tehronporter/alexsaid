import {
  ArrowLeft,
  Bookmark,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Home,
  Image,
  Link as LinkIcon,
  MoreHorizontal,
  Search,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const productIcons = {
  back: ArrowLeft,
  copy: Copy,
  discover: Compass,
  download: Download,
  external: ExternalLink,
  image: Image,
  link: LinkIcon,
  more: MoreHorizontal,
  quote: Home,
  save: Bookmark,
  search: Search,
  share: Share2,
} as const;

export type ProductIconName = keyof typeof productIcons;

export function ProductIcon({ name, className, filled = false }: { name: ProductIconName; className?: string; filled?: boolean }) {
  const Icon = productIcons[name];
  return <Icon aria-hidden="true" className={cn("size-4", className)} fill={filled ? "currentColor" : "none"} />;
}
