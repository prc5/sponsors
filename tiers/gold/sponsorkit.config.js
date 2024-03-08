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
      title: "Gold Sponsors",
      monthlyDollars: 800,
      preset: presets.large,
    },
  ],
});
