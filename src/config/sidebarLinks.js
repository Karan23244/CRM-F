// ==========================
// 📁 sidebarLinks.js
// ==========================
// This file defines all sidebar menu links used in your dashboard.
// Each link has the following structure:
//   - label: Name displayed in the sidebar
//   - to: Route path (if it's a direct link)
//   - roles: User roles that can see this link
//   - sublinks: Nested items (optional for dropdown menus)
//
// Roles supported:
//   - admin
//   - advertiser / advertiser_manager
//   - publisher / publisher_manager
// ==========================
export const sidebarLinks = [
  // ==========================
  // 🔹 ADMIN SECTION
  // ==========================
  {
    to: "home",
    label: "Dashboard",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "operations",
      "publisher",
      "publisher_manager",
    ],
  },
  {
    label: "Users",
    roles: ["admin","advertiser_manager","publisher_manager"],
    sublinks: [
      { to: "listsubadmin", label: "Existing Users", roles: ["admin"] },
      { to: "createsubadmin", label: "Create User", roles: ["admin","advertiser_manager","publisher_manager"] },
    ],
  },
  // { to: "review", label: "Review", roles: ["admin"] },
  { to: "advertiser-data", label: "Advertiser Data", roles: ["admin"] },
  { to: "publisher-data", label: "Publisher Data", roles: ["admin"] },

  // ==========================
  // 🔹 ADVERTISER SECTION
  // ==========================
  {
    label: "Advertiser",
    roles: ["advertiser", "advertiser_manager", "operations"],
    sublinks: [
      {
        to: "listadvform",
        label: "Existing Advertisers",
        roles: ["advertiser", "advertiser_manager", "operations"],
      },
      {
        to: "createadvform",
        label: "Add New Advertiser",
        roles: ["advertiser", "advertiser_manager", "operations"],
      },
    ],
  },

  // ==========================
  // 🔹 PUBLISHER SECTION
  // ==========================
  {
    label: "Publisher",
    roles: ["publisher", "publisher_manager"],
    sublinks: [
      {
        to: "listpubform",
        label: "Existing Publishers",
        roles: ["publisher", "publisher_manager"],
      },
      {
        to: "createpubform",
        label: "Add New Publisher",
        roles: ["publisher", "publisher_manager"],
      },
    ],
  },

  // ==========================
  // 🔹 CAMPAIGN SECTION
  // (Used by all user types)
  // ==========================
  {
    label: "Campaigns",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "publisher",
      "publisher_manager",
      "operations",
    ],
    sublinks: [
      // --- Campaign Data Submenu ---
      {
        label: "Campaign Data",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "publisher",
          "publisher_manager",
          "operations",
        ],
        sublinks: [
          {
            to: "pubidtable",
            label: "PUBID",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "publisher",
              "publisher_manager",
              "operations",
            ],
          },
          // Separate PID Data routes for different roles
          { to: "current-campaign", label: "PID Data", roles: ["admin"] },
          {
            to: "currentadvdata",
            label: "PID Data",
            roles: ["advertiser", "advertiser_manager", "operations"],
          },
          {
            to: "currentpubdata",
            label: "PID Data",
            roles: ["publisher", "publisher_manager"],
          },
          {
            to: "campaignlist",
            label: "Campaigns",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "publisher",
              "publisher_manager",
              "operations",
            ],
          },
        ],
      },

      // --- Create Campaign ---
      {
        to: "createcampaign",
        label: "Create Campaign",
        roles: ["advertiser", "advertiser_manager", "operations", "admin"],
      },

      // --- Add Parameters ---
      {
        label: "Add Parameter",
        roles: ["admin", "advertiser", "advertiser_manager", "operations"],
        sublinks: [
          {
            to: "pid",
            label: "PID Form",
            roles: ["admin", "advertiser", "advertiser_manager", "operations"],
          },
          {
            to: "payableevent",
            label: "Payable Events",
            roles: ["admin", "advertiser", "advertiser_manager", "operations"],
          },
          {
            to: "mmptracker",
            label: "MMP Tracker",
            roles: ["admin", "advertiser", "advertiser_manager", "operations"],
          },
        ],
      },
    ],
  },

  // ==========================
  // 🔹 ADVERTISER REQUESTS
  // ==========================
  {
    to: "view-request",
    label: "Requests",
    roles: ["advertiser", "advertiser_manager", "operations", "admin"],
  },

  // ==========================
  // 🔹 PUBLISHER REQUESTS
  // ==========================
  {
    to: "makerequest",
    label: "Request Links",
    roles: ["publisher", "publisher_manager", "admin"],
  },

  // ==========================
  // 🔹 ANALYTICS / REPORTS
  // ==========================
  {
    label: "Analysis",
    roles: [
      "admin",
      "advertiser",
      "publisher",
      "advertiser_manager",
      "publisher_manager",
      "operations",
    ],
    sublinks: [
      {
        to: "reportform",
        label: "Reports",
        roles: ["operations", "advertiser_manager", "advertiser", "admin"],
      },
      {
        to: "genrategraph",
        label: "Graph",
        roles: ["operations", "advertiser_manager", "advertiser", "admin"],
      },
      {
        to: "analytics",
        label: "Analytics",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "publisher",
          "publisher_manager",
          "operations",
        ],
      },
    ],
  },
  // ==========================
  // 🔹 PUBLISHER MANAGER SECTION
  // ==========================
  {
    to: "blacklistpid",
    label: "Blacklist PID",
    roles: ["publisher_manager", "admin"],
  },
  {
    to: "conversion",
    label: "Conversions",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "publisher",
      "publisher_manager",
      "operations",
    ],
  },
  {
    label: "Step To Sell",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "operations",
      "publisher",
      "publisher_manager",
    ],
    permission: "can_add_store",
    sublinks: [
      {
        to: "createdeals",
        label: "Create Deals",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "listdeals",
        label: "List Deals",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "createoffer",
        label: "Create Offer",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "listoffer",
        label: "List Offers",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "createcategory",
        label: "Create Category",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "listcategory",
        label: "List Categories",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
    ],
  },
  // ==========================
  // 🔹 ACCOUNT SETTINGS
  // ==========================
  {
    to: "myaccount",
    label: "My Account",
    roles: [
      "admin",
      "advertiser",
      "publisher",
      "advertiser_manager",
      "publisher_manager",
      "operations",
    ],
  },
];
