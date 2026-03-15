import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import CreateCampaign from "./pages/CreateCampaign";
import DefineQuery from "./pages/DefineQuery";
import ActiveCampaigns from "./pages/ActiveCampaigns";
import InactiveCampaigns from "./pages/InactiveCampaigns";
import CampaignWorkspace from "./pages/CampaignWorkspace";

import ProspectHistory from "./pages/ProspectHistory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="create" element={<CreateCampaign />} />
          <Route path="create/query" element={<DefineQuery />} />
          <Route path="active" element={<ActiveCampaigns />} />
          <Route path="inactive" element={<InactiveCampaigns />} />
          <Route path="campaign/:id" element={<CampaignWorkspace />} />
          <Route path="campaign/:id/prospect/:dmId" element={<ProspectHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
