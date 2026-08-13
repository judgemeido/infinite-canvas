import { ImagePlus, Settings2 } from "lucide-react";

export const navigationTools = [
    {
        slug: "image",
        icon: ImagePlus,
    },
    {
        slug: "config",
        icon: Settings2,
    },
] as const;

export type NavigationToolSlug = (typeof navigationTools)[number]["slug"];
