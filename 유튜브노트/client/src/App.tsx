import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import SimpleHomePage from "@/pages/SimpleHomePage";
import ErrorBoundary from "@/components/ErrorBoundary";

console.log("🔍 App.tsx 로딩");

function Router() {
  console.log("🔍 Router 컴포넌트 렌더링");
  return (
    <Switch>
      <Route path="/">
        <ErrorBoundary>
          <HomePage />
        </ErrorBoundary>
      </Route>
      <Route path="/simple" component={SimpleHomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("🔍 App 컴포넌트 렌더링");
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
