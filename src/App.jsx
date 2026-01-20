import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoutes";
import DashboardLayout from "./layouts/DashboardLayout";

// Import all page components (reuse existing ones)
import SubAdminForm from "./components/Admin/SubAdminForm";
import CreateSubAdmin from "./components/Admin/CreateSubAdmin";
import ReviewForm from "./components/Admin/ReviewForm";
import CampianData from "./components/Admin/CampianData";
import AdvnameData from "./components/Admin/AdvnameData";
import PubnameData from "./components/Admin/PubnameData";
import AdvFormComponent from "./components/Advertiser/AdvFormComponent";
import AdvertiserCurrentData from "./components/Advertiser/AdvertiserCurrentData";
import PIDForm from "./components/Advertiser/PIDForm";
import PayableEventForm from "./components/Advertiser/PayableEventForm";
import MMPTrackerForm from "./components/Advertiser/MMPTrackerForm";
import NewRequest from "./components/Advertiser/NewRequest";
import ReportForm from "./components/Advertiser/ReportForm";
import ExcelGraphCompare from "./components/Advertiser/Graph";
import PublisherFormComponent from "./components/Publisher/PublisherFormComponent";
import MakeRequest from "./components/Publisher/MakeRequest";
import BlacklistManager from "./components/Publisher/BlacklistManager";
import CampaignList from "./components/Advertiser/CampaignList";
import CreateCampaign from "./components/Advertiser/CreateCampaignForm";
import MyAccount from "./components/MyAccount";
import CampaginAnalytics from "./components/Campaign_Analytics/CampainDashboard";
import PublisherCampaigns from "./components/Publisher/PublisherCampaigns";
import PublisherCurrentData from "./components/Publisher/PublisherCurrentData";
import PubIdTable from "./components/Publisher/PubIdTable";
import CreateAdvertiser from "./components/Advertiser/CreateAdvertiser";
import CreatePublisher from "./components/Publisher/CreatePublisher";
import Notification from "./components/NotificationBar";
import Home from "./layouts/Homepage";
import Conversion from "./components/Publisher/Conversion";
import Createdeals from "./components/Steptosell/Createdeals";
import Createoffer from "./components/Steptosell/Createoffer";
import Listoffer from "./components/Steptosell/Listoffer";
import Listdeals from "./components/Steptosell/Listdeals";
import Listcategory from "./components/Steptosell/Listcategory";
import Createcategory from "./components/Steptosell/Createcategory";
const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "admin",
              "advertiser",
              "publisher",
              "advertiser_manager",
              "publisher_manager",
              "operations",
            ]}
          />
        }>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* All role pages */}
          <Route path="home" element={<Home />} />
          <Route path="listsubadmin" element={<SubAdminForm />} />
          <Route path="createsubadmin" element={<CreateSubAdmin />} />
          <Route path="review" element={<ReviewForm />} />
          <Route path="current-campaign" element={<CampianData />} />
          <Route path="advertiser-data" element={<AdvnameData />} />
          <Route path="publisher-data" element={<PubnameData />} />
          <Route path="listadvform" element={<AdvFormComponent />} />
          <Route path="currentadvdata" element={<AdvertiserCurrentData />} />
          <Route path="currentpubdata" element={<PublisherCurrentData />} />
          <Route path="createcampaign" element={<CreateCampaign />} />
          <Route path="campaignlist" element={<CampaignList />} />
          <Route path="pid" element={<PIDForm />} />
          <Route path="payableevent" element={<PayableEventForm />} />
          <Route path="mmptracker" element={<MMPTrackerForm />} />
          <Route path="view-request" element={<NewRequest />} />
          <Route path="reportform" element={<ReportForm />} />
          <Route path="genrategraph" element={<ExcelGraphCompare />} />
          <Route path="listpubform" element={<PublisherFormComponent />} />
          <Route path="makerequest" element={<MakeRequest />} />
          <Route path="blacklistpid" element={<BlacklistManager />} />
          <Route path="analytics" element={<CampaginAnalytics />} />
          <Route path="campaigndata" element={<PublisherCampaigns />} />
          <Route path="pubidtable" element={<PubIdTable />} />
          <Route path="createadvform" element={<CreateAdvertiser />} />
          <Route path="createpubform" element={<CreatePublisher />} />
          <Route path="notifications" element={<Notification />} />
          <Route path="conversion" element={<Conversion />} />
          <Route path="createdeals" element={<Createdeals />} />
          <Route path="createdeals/edit/:id" element={<Createdeals />} />
          <Route path="createoffer" element={<Createoffer />} />
          <Route path="createoffer/edit/:id" element={<Createoffer />} />
          <Route path="listdeals" element={<Listdeals />} />
          <Route path="listoffer" element={<Listoffer />} />
          <Route path="listcategory" element={<Listcategory />} />
          <Route path="createcategory" element={<Createcategory />} />
          <Route path="myaccount" element={<MyAccount />} />
          {/* default redirect */}
          <Route index element={<Navigate to="home" replace />} />
        </Route>
      </Route>
    </Routes>
  </Router>
);

export default AppRoutes;
