import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Development: Enable test data seeding from browser console
// Usage: window.seedTestData() or window.clearTestData()
import "./services/seedService";

createRoot(document.getElementById("root")!).render(<App />);
