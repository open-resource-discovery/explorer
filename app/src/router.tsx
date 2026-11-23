import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { seedLocalConnectionIfEmpty } from "./lib/connection/seed";
import { AddConnectionPage } from "./pages/AddConnectionPage";
import { ConnectionDetailPage } from "./pages/ConnectionDetailPage";
import { ConnectionsPage } from "./pages/ConnectionsPage";
import { ExplorerPage } from "./pages/ExplorerPage";
import { RootLayout } from "./pages/RootLayout";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    seedLocalConnectionIfEmpty();
    throw redirect({ to: "/connections" });
  },
});

const connectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connections",
  component: ConnectionsPage,
});

const addConnectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connections/new",
  component: AddConnectionPage,
});

export const editConnectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connections/$id/edit",
  component: function EditConnectionPage() {
    const { id } = editConnectionRoute.useParams();
    return <AddConnectionPage editId={id} />;
  },
});

export const connectionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connections/$id",
  component: ConnectionDetailPage,
});

export const explorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connections/$id/documents/$docId",
  component: ExplorerPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  connectionsRoute,
  addConnectionRoute,
  editConnectionRoute,
  connectionDetailRoute,
  explorerRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
