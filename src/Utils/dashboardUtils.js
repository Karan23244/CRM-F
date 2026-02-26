import dayjs from "dayjs";

export const getKPIs = (data = []) => {
  if (!Array.isArray(data)) {
    return {
      totalCampaigns: 0,
      liveCampaigns: 0,
      advertisers: 0,
      publishers: 0,
      geos: 0,
    };
  }

  // 🔹 Unique Campaigns (campaign_id preferred, fallback to campaign_name)
  const uniqueCampaigns = new Set(
    data.map((d) => d.campaign_id || d.campaign_name).filter(Boolean),
  );

  // 🔹 Live Campaigns (no paused_date)
  const liveCampaigns = new Set(
    data
      .filter((d) => !d.paused_date || d.paused_date === "")
      .map((d) => d.campaign_name)
      .filter(Boolean),
  );

  // 🔹 Unique Advertisers
  const uniqueAdvertisers = new Set(data.map((d) => d.adv_id).filter(Boolean));

  // 🔹 Unique Publishers
  const uniquePublishers = new Set(data.map((d) => d.pub_id).filter(Boolean));

  // 🔹 Unique GEOs
  const uniqueGeos = new Set(data.map((d) => d.geo).filter(Boolean));

  return {
    totalCampaigns: uniqueCampaigns.size,
    liveCampaigns: liveCampaigns.size,
    advertisers: uniqueAdvertisers.size,
    publishers: uniquePublishers.size,
    geos: uniqueGeos.size,
  };
};

/* OFFERS OVER TIME (LINE CHART) */
export const groupByDate = (data) => {
  const map = {};
  data.forEach((d) => {
    const date = dayjs(d.shared_date).format("DD MMM");
    map[date] = (map[date] || 0) + 1;
  });

  return Object.entries(map).map(([date, count]) => ({
    date,
    count,
  }));
};

/* TOP ADVERTISERS */
export const groupByAdvertiser = (data) => {
  const map = {};

  data.forEach((d) => {
    if (!d.adv_id || !d.adv_name || !d.campaign_name) return;

    const key = `${d.adv_id}__${d.adv_name}`;
    const campaign = d.campaign_name.trim().toLowerCase();

    if (!map[key]) {
      map[key] = {
        adv_id: d.adv_id,
        adv_name: d.adv_name,
        campaigns: new Set(),
      };
    }

    map[key].campaigns.add(campaign);
  });

  return Object.values(map)
    .map((item) => ({
      adv_id: item.adv_id,
      name: item.adv_name,
      value: item.campaigns.size,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

/* TOP PUBLISHERS */
export const groupByPublisher = (data) => {
  const map = {};

  data.forEach((d) => {
    if (!d.pub_id || !d.pub_am || !d.campaign_name) return;

    const key = `${d.pub_id}__${d.pub_am}`;
    const campaign = d.campaign_name.trim().toLowerCase();

    if (!map[key]) {
      map[key] = {
        pub_id: d.pub_id,
        pub_name: d.pub_am,
        campaigns: new Set(),
      };
    }

    map[key].campaigns.add(campaign);
  });

  return Object.values(map)
    .map((item) => ({
      pub_id: item.pub_id,
      name: item.pub_name,
      value: item.campaigns.size,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

/* OS SPLIT – UNIQUE CAMPAIGN NAME COUNT */
export const groupByOS = (data) => {
  const map = {};

  data.forEach((d) => {
    if (!d.os || !d.campaign_name) return;

    if (!map[d.os]) {
      map[d.os] = new Set();
    }

    // add unique campaign_name
    map[d.os].add(d.campaign_name.trim());
  });

  return Object.entries(map).map(([name, campaigns]) => ({
    name, // OS name
    value: campaigns.size, // unique campaign count
  }));
};

/* VERTICAL SPLIT */
/* VERTICAL SPLIT – UNIQUE CAMPAIGN NAME COUNT */
export const groupByVertical = (data) => {
  const map = {};

  data.forEach((d) => {
    if (!d.vertical || !d.campaign_name) return;

    if (!map[d.vertical]) {
      map[d.vertical] = new Set();
    }

    // add unique campaign_name
    map[d.vertical].add(d.campaign_name.trim());
  });

  return Object.entries(map).map(([name, campaigns]) => ({
    name, // Vertical name
    value: campaigns.size, // unique campaign count
  }));
};
