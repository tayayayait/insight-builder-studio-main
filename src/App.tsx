import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Upload from "./pages/Upload";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Validation from "./pages/Validation";
import ValidationHome from "./pages/ValidationHome";
import ValidationQueue from "./pages/ValidationQueue";
import Analysis from "./pages/Analysis";
import AnalysisResults from "./pages/AnalysisResults";
import Reports from "./pages/Reports";
import ReportCreate from "./pages/ReportCreate";
import AdminUsers from "./pages/admin/Users";
import AdminLogs from "./pages/admin/Logs";
import AdminSettings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/validation/queue" element={<ValidationQueue />} />
          <Route path="/validation/:id" element={<Validation />} />
          <Route path="/validation" element={<ValidationHome />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/analysis/results/:id" element={<AnalysisResults />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/create" element={<ReportCreate />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
