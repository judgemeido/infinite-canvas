import { nanoid } from "nanoid";

export type PromptSource = {
    id: string;
    name: string;
    url: string;
    homepage: string;
    enabled: boolean;
    builtIn: boolean;
};

export const PROMPT_REGISTRY_HOMEPAGE = "https://github.com/yukkcat/image-prompts";

export function createPromptSource(source?: Partial<PromptSource>): PromptSource {
    return {
        id: source?.id?.trim() || nanoid(),
        name: source?.name?.trim() || "",
        url: source?.url?.trim() || "",
        homepage: source?.homepage?.trim() || "",
        enabled: source?.enabled ?? true,
        builtIn: source?.builtIn ?? false,
    };
}

// 仅保留本地内置的「诗词风景」提示词库（100 套多风格文字提示词，随站点静态资源分发），
// 原有 7 个远程 GitHub 提示词来源已下线隐藏。
export const DEFAULT_PROMPT_SOURCES: PromptSource[] = [
    {
        id: "poem-scenery",
        name: "诗词风景 · 灵感提示词",
        url: "/prompts/poem-scenery.json",
        homepage: "",
        enabled: true,
        builtIn: true,
    },
];

