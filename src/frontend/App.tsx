import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import NewProject from "./pages/NewProject";
import Project from "./pages/Project";
import AgentChat from "./pages/AgentChat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:projectName" element={<Project />} />
          <Route path="/projects/:projectName/agents/:agentName" element={<AgentChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
