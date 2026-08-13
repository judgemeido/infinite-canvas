// AIGC绘卷 Worker：把同源 /api/* 请求反向代理到 api.change2pro.com，
// 其余请求回退到静态资源（env.ASSETS）。用于绕过浏览器跨域限制。
const API_UPSTREAM = "https://api.change2pro.com";
const PROXY_PREFIX = "/api";

const CORS_HEADERS = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "*",
    "access-control-max-age": "86400",
};

// 逐跳头/身份头不转发给上游，由 fetch 自行生成
const HOP_BY_HOP_HEADERS = new Set([
    "host",
    "origin",
    "referer",
    "cookie",
    "content-length",
    "connection",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-visitor",
    "x-forwarded-for",
]);

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== PROXY_PREFIX && !url.pathname.startsWith(`${PROXY_PREFIX}/`)) {
            return env.ASSETS.fetch(request);
        }
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const upstream = new URL(url.pathname.slice(PROXY_PREFIX.length) + url.search, API_UPSTREAM);
        const headers = new Headers();
        for (const [key, value] of request.headers) {
            if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
        }

        const upstreamResponse = await fetch(upstream, {
            method: request.method,
            headers,
            body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        });

        const responseHeaders = new Headers(upstreamResponse.headers);
        for (const [key, value] of Object.entries(CORS_HEADERS)) responseHeaders.set(key, value);

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: responseHeaders,
        });
    },
};
