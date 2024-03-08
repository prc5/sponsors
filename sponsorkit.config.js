import { defineConfig, presets } from "sponsorkit";

export default defineConfig({
  // Providers configs
  github: {
    type: "user",
    login: "prc5",
  },

  // Rendering configs
  width: 800,
  formats: ["svg", "png"],
  tiers: [
    {
      title: "Past Sponsors",
      monthlyDollars: -1,
      preset: presets.xs,
    },
    {
      title: "Donors",
      preset: presets.xs,
    },
    {
      title: "Fans",
      monthlyDollars: 10,
      preset: presets.small,
    },
    {
      title: "Supporter",
      monthlyDollars: 100,
      preset: presets.base,
    },
    {
      title: "Project backer",
      monthlyDollars: 200,
      preset: presets.medium,
    },
    {
      title: "Silver Sponsors",
      monthlyDollars: 400,
      preset: presets.large,
    },
    {
      title: "Gold Sponsors",
      monthlyDollars: 800,
      preset: presets.large,
    },
    {
      title: "Platinum Sponsors",
      monthlyDollars: 1600,
      preset: presets.xl,
    },
  ],
});
