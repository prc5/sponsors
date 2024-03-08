import { presets } from "sponsorkit";

export const Tiers = {
  Past: {
    title: "Past Sponsors",
    monthlyDollars: -1,
    preset: presets.xs,
  },
  Starter: {
    title: "Donors",
    preset: presets.xs,
  },
  Fans: {
    title: "Fans",
    monthlyDollars: 10,
    preset: presets.small,
  },
  Supporter: {
    title: "Supporter",
    monthlyDollars: 100,
    preset: presets.base,
  },
  Backer: {
    title: "Project backer",
    monthlyDollars: 200,
    preset: presets.medium,
  },
  Silver: {
    title: "Silver Sponsors",
    monthlyDollars: 400,
    preset: presets.large,
  },
  Gold: {
    title: "Gold Sponsors",
    monthlyDollars: 800,
    preset: presets.large,
  },
  Platinum: {
    title: "Platinum Sponsors",
    monthlyDollars: 1600,
    preset: presets.xl,
  },
};
