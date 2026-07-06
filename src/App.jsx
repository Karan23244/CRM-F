import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

const LoginForm = lazy(() => import("./components/Login"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoutes"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));

const SubAdminForm = lazy(() => import("./components/Admin/SubAdminForm"));
const CreateSubAdmin = lazy(() => import("./components/Admin/CreateSubAdmin"));
const ReviewForm = lazy(() => import("./components/Admin/ReviewForm"));
const CampianData = lazy(() => import("./components/Admin/CampianData"));
const AdvnameData = lazy(() => import("./components/Admin/AdvnameData"));
const PubnameData = lazy(() => import("./components/Admin/PubnameData"));
const AdvFormComponent = lazy(() => import("./components/Advertiser/AdvFormComponent"));
const AdvertiserCurrentData = lazy(() => import("./components/Advertiser/AdvertiserCurrentData"));
const PIDForm = lazy(() => import("./components/Advertiser/PIDForm"));
const PayableEventForm = lazy(() => import("./components/Advertiser/PayableEventForm"));
const MMPTrackerForm = lazy(() => import("./components/Advertiser/MMPTrackerForm"));
const NewRequest = lazy(() => import("./components/Advertiser/NewRequest"));
const ReportForm = lazy(() => import("./components/Advertiser/ReportForm"));
const ExcelGraphCompare = lazy(() => import("./components/Advertiser/Graph"));
const PublisherFormComponent = lazy(() => import("./components/Publisher/PublisherFormComponent"));
const MakeRequest = lazy(() => import("./components/Publisher/MakeRequest"));
const BlacklistManager = lazy(() => import("./components/Publisher/BlacklistManager"));
const CampaignList = lazy(() => import("./components/Advertiser/CampaignList"));
const CreateCampaign = lazy(() => import("./components/Advertiser/CreateCampaignForm"));
const MyAccount = lazy(() => import("./components/MyAccount"));
const CampaginAnalytics = lazy(() => import("./components/Campaign_Analytics/CampaignAnalyticsTable"));
const OldCampaginAnalytics = lazy(() => import("./components/Campaign_Analytics/CampainDashboard"));
const PublisherCampaigns = lazy(() => import("./components/Publisher/PublisherCampaigns"));
const PublisherCurrentData = lazy(() => import("./components/Publisher/PublisherCurrentData"));
const PubIdTable = lazy(() => import("./components/Publisher/PubIdTable"));
const CreateAdvertiser = lazy(() => import("./components/Advertiser/CreateAdvertiser"));
const CreatePublisher = lazy(() => import("./components/Publisher/CreatePublisher"));
const Notification = lazy(() => import("./components/NotificationBar"));
const Home = lazy(() => import("./layouts/Homepage"));
const Conversion = lazy(() => import("./components/Publisher/Conversion"));
const Createdeals = lazy(() => import("./components/Steptosell/Createdeals"));
const Createoffer = lazy(() => import("./components/Steptosell/Createoffer"));
const Listoffer = lazy(() => import("./components/Steptosell/Listoffer"));
const Listdeals = lazy(() => import("./components/Steptosell/Listdeals"));
const Listcategory = lazy(() => import("./components/Steptosell/Listcategory"));
const Createcategory = lazy(() => import("./components/Steptosell/Createcategory"));
const AdvertiserBilling = lazy(() => import("./components/Billing/AdvertiserBilling"));
const PublisherBilling = lazy(() => import("./components/Billing/PublisherBilling"));
const ValidationAdv = lazy(() => import("./components/Billing/ValidationAdvertiser"));
const ValidationPub = lazy(() => import("./components/Billing/ValidationPublisher"));
const AdvertiserAccount = lazy(() => import("./components/Accounts/AdvertiserAccount"));
const PublisherAccount = lazy(() => import("./components/Accounts/PublisherAccount"));
const PublisherLogin = lazy(() => import("./components/PublisherAM/PublisherLogin"));
const Billing = lazy(() => import("./components/Billing/Billing"));
const ForgotPassword = lazy(() => import("./components/ForgetPassword"));
const CampianDataOptimization = lazy(() => import("./components/Optimization/piddata"));
const TotalPidData = lazy(() => import("./components/Optimization/CampaignPid"));
const AddDetails = lazy(() => import("./components/PublisherAM/DetailsAdd"));
const CampaignConfigPage = lazy(() => import("./components/Campaign_Analytics/Campaignconfigpage"));
const PublisherRevnu = lazy(() => import("./components/Billing/PublisherRevnu"));
const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "16px", color: "#888" }}>
    Loading...
  </div>
);

const AppRoutes = () => (
  <Router>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/publisherlogin" element={<PublisherLogin />} />
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
              "accounts",
              "publisher_external",
              "optimization",
              "pub_executive",
              "adv_executive",
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
          <Route path="newanalytics" element={<CampaginAnalytics />} />
          <Route path="old-analytics" element={<OldCampaginAnalytics />} />
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
          <Route path="billing" element={<Billing />} />
          <Route path="advertiserbill" element={<AdvertiserBilling />} />
          <Route path="publisherbill" element={<PublisherBilling />} />
          <Route path="accountsadvbill" element={<AdvertiserAccount />} />
          <Route path="accountspubbill" element={<PublisherAccount />} />
          <Route path="publisherrevenue" element={<PublisherRevnu />} />
          <Route
            path="optimizationalldata"
            element={<CampianDataOptimization />}
          />
          <Route path="adddetails" element={<AddDetails />} />
          <Route path="totalpiddata" element={<TotalPidData />} />
          <Route path="myaccount" element={<MyAccount />} />
          <Route path="campaign-config" element={<CampaignConfigPage />} />
          {/* default redirect */}
          <Route index element={<Navigate to="home" replace />} />
          
        </Route>
      </Route>
    </Routes>
    </Suspense>
  </Router>
);

export default AppRoutes;
