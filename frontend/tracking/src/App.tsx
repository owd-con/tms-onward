import { lazy, Suspense } from "react";
import { FullPageLoading } from "@/components";

// Lazy load the public tracking router
const PublicRouter = lazy(() => import("@/platforms/public/router"));

function App() {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <PublicRouter />
    </Suspense>
  );
}

export default App;
