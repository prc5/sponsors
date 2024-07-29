import { Tiers } from "./constants/tiers.constants";

const pastPlatinumSponsors = ["microsoft"];
const pastGoldSponsors = [];
const pastSilverSponsors = [];

/** @type {import("sponsorkit").SponsorkitConfig} */
export const sharedSponsorConfig = {
  github: {
    type: "user",
    login: "prc5",
  },
  width: 800,
  formats: ["svg", "png"],
  includePastSponsors: true,
  includePrivate: true,
  onSponsorsFetched: (sponsors) => {
    sponsors.forEach((sponsor) => {
      if (pastPlatinumSponsors.includes(sponsor.sponsor.name)) {
        sponsor.monthlyDollars = Tiers.Platinum.monthlyDollars;
      }
      if (pastGoldSponsors.includes(sponsor.sponsor.name)) {
        sponsor.monthlyDollars = Tiers.Platinum.monthlyDollars;
      }
      if (pastSilverSponsors.includes(sponsor.sponsor.name)) {
        sponsor.monthlyDollars = Tiers.Platinum.monthlyDollars;
      }
    });
  },
};
