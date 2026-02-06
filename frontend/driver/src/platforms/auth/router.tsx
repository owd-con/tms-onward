import { Navigate, Route, Routes } from "react-router-dom";

interface RouteConfig<T = unknown> {
  path: string;
  element: React.ComponentType<T>;
}

const pages = import.meta.glob<{ default: RouteConfig[] }>(
  "./**/*_subrouter.tsx",
  { eager: true }
);

const routes: RouteConfig[] = Object.values(pages).flatMap(
  (mod) => mod.default || []
);

const AuthRouter = () => {
  return (
    <Routes>
      {routes.map((r, i) => (
        <Route key={i} path={r.path} element={<r.element />} />
      ))}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default AuthRouter;
