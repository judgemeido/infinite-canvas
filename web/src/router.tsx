import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AnalyticsTracker } from "@/components/layout/analytics-tracker";
import UserLayout from "@/layouts/user-layout";
import ConfigPage from "@/pages/config";
import ImagePage from "@/pages/image";
import LevelsPage from "@/pages/levels";
import PoemChainPage from "@/pages/poem-chain";
import NotFound from "@/pages/not-found";

export const router = createBrowserRouter([
    {
        element: (
            <UserLayout>
                <AnalyticsTracker />
                <Outlet />
            </UserLayout>
        ),
        children: [
            { path: "/", element: <Navigate to="/levels" replace /> },
            { path: "/levels", element: <LevelsPage /> },
            { path: "/poem-chain", element: <PoemChainPage /> },
            { path: "/image", element: <ImagePage /> },
            { path: "/config", element: <ConfigPage /> },
        ],
    },
    { path: "*", element: <NotFound /> },
]);
