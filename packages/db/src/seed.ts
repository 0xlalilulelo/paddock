/**
 * Seed script — populates sources and x_accounts tables.
 * Run with: npx tsx packages/db/src/seed.ts
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { db } from "./client";
import { sources, xAccounts, articles } from "./schema";

function urlHash(url: string) {
  return createHash("md5").update(url.toLowerCase().trim()).digest("hex");
}

// ─── Sources ──────────────────────────────────────────────────────────────────

const SOURCES = [
  // Tier 1 — scraped every minute
  { id: "motorsport-com-f1",      name: "Motorsport.com",      domain: "https://www.motorsport.com/f1/news/",          faviconUrl: "https://www.motorsport.com/favicon.ico",  tier: 1 as const, series: ["f1"] },
  { id: "motorsport-com-imsa",    name: "Motorsport.com",      domain: "https://www.motorsport.com/imsa/news/",         faviconUrl: "https://www.motorsport.com/favicon.ico",  tier: 1 as const, series: ["imsa"] },
  { id: "motorsport-com-wec",     name: "Motorsport.com",      domain: "https://www.motorsport.com/wec/news/",          faviconUrl: "https://www.motorsport.com/favicon.ico",  tier: 1 as const, series: ["wec"] },
  { id: "motorsport-com-nascar",  name: "Motorsport.com",      domain: "https://www.motorsport.com/nascar/news/",       faviconUrl: "https://www.motorsport.com/favicon.ico",  tier: 1 as const, series: ["nascar"] },
  { id: "the-race-f1",            name: "The Race",            domain: "https://the-race.com/formula-1/",              faviconUrl: "https://the-race.com/favicon.ico",         tier: 1 as const, series: ["f1"] },
  { id: "the-race-imsa",          name: "The Race",            domain: "https://the-race.com/imsa/",                   faviconUrl: "https://the-race.com/favicon.ico",         tier: 1 as const, series: ["imsa"] },
  { id: "the-race-wec",           name: "The Race",            domain: "https://the-race.com/le-mans-wec/",            faviconUrl: "https://the-race.com/favicon.ico",         tier: 1 as const, series: ["wec"] },
  { id: "the-race-nascar",        name: "The Race",            domain: "https://the-race.com/nascar/",                 faviconUrl: "https://the-race.com/favicon.ico",         tier: 1 as const, series: ["nascar"] },
  { id: "autosport-f1",           name: "Autosport",           domain: "https://www.autosport.com/f1/",                faviconUrl: "https://www.autosport.com/favicon.ico",    tier: 1 as const, series: ["f1"] },
  { id: "autosport-imsa",         name: "Autosport",           domain: "https://www.autosport.com/imsa/",              faviconUrl: "https://www.autosport.com/favicon.ico",    tier: 1 as const, series: ["imsa"] },
  { id: "autosport-wec",          name: "Autosport",           domain: "https://www.autosport.com/wec/",               faviconUrl: "https://www.autosport.com/favicon.ico",    tier: 1 as const, series: ["wec"] },
  { id: "autosport-nascar",       name: "Autosport",           domain: "https://www.autosport.com/nascar/",            faviconUrl: "https://www.autosport.com/favicon.ico",    tier: 1 as const, series: ["nascar"] },
  { id: "racefans",               name: "RaceFans",            domain: "https://www.racefans.net",                     faviconUrl: "https://www.racefans.net/favicon.ico",     tier: 1 as const, series: ["f1"] },
  { id: "imsa",                   name: "IMSA",                domain: "https://www.imsa.com/news/",                   faviconUrl: "https://www.imsa.com/favicon.ico",         tier: 1 as const, series: ["imsa"] },
  { id: "fiawec",                 name: "FIA WEC",             domain: "https://www.fiawec.com/en/news.html",          faviconUrl: "https://www.fiawec.com/favicon.ico",       tier: 1 as const, series: ["wec"] },
  { id: "nascar",                 name: "NASCAR",              domain: "https://www.nascar.com/news/",                 faviconUrl: "https://www.nascar.com/favicon.ico",       tier: 1 as const, series: ["nascar"] },
  { id: "radiolemans",            name: "Radio Le Mans",       domain: "https://radiolemans.com/news/",                faviconUrl: "https://radiolemans.com/favicon.ico",      tier: 1 as const, series: ["wec", "imsa"] },
  // Tier 2 — scraped every 3 minutes
  { id: "formula1-com",           name: "Formula 1",           domain: "https://www.formula1.com/en/latest.html",      faviconUrl: "https://www.formula1.com/favicon.ico",     tier: 2 as const, series: ["f1"] },
  { id: "gpfans",                 name: "GPFans",              domain: "https://www.gpfans.com/en/",                   faviconUrl: "https://www.gpfans.com/favicon.ico",       tier: 2 as const, series: ["f1"] },
  { id: "planet-f1",              name: "Planet F1",           domain: "https://www.planetf1.com/news/",               faviconUrl: "https://www.planetf1.com/favicon.ico",     tier: 2 as const, series: ["f1"] },
  { id: "racer",                  name: "Racer",               domain: "https://racer.com/",                           faviconUrl: "https://racer.com/favicon.ico",            tier: 2 as const, series: ["imsa", "wec"] },
  { id: "dailysportscar",         name: "Daily Sportscar",     domain: "https://www.dailysportscar.com/",              faviconUrl: "https://www.dailysportscar.com/favicon.ico", tier: 2 as const, series: ["wec", "imsa"] },
  { id: "speedcafe",              name: "Speedcafe",           domain: "https://www.speedcafe.com/category/formula1/", faviconUrl: "https://www.speedcafe.com/favicon.ico",    tier: 2 as const, series: ["f1"] },
  { id: "nascar-nbcsports",       name: "NASCAR on NBC",       domain: "https://motorsports.nbcsports.com/nascar/",    faviconUrl: "https://motorsports.nbcsports.com/favicon.ico", tier: 2 as const, series: ["nascar"] },
];

// ─── X Accounts ───────────────────────────────────────────────────────────────

const X_ACCOUNTS = [
  // ─ F1 official ─
  { handle: "F1",              displayName: "Formula 1",              accountType: "official_series" as const, series: ["f1"],           isActive: true },
  { handle: "fia",             displayName: "FIA",                    accountType: "official_series" as const, series: ["f1", "wec"],    isActive: true },
  { handle: "MercedesAMGF1",  displayName: "Mercedes-AMG F1",        accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "redbullracing",  displayName: "Red Bull Racing",         accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "ScuderiaFerrari",displayName: "Scuderia Ferrari",        accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "McLarenF1",      displayName: "McLaren F1",              accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "AstonMartinF1",  displayName: "Aston Martin F1",         accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "AlpineF1Team",   displayName: "Alpine F1 Team",          accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "HaasF1Team",     displayName: "Haas F1 Team",            accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "WilliamsRacing", displayName: "Williams Racing",         accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "KickSauber",     displayName: "Kick Sauber",             accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  { handle: "VisaRBF1Team",   displayName: "Visa Cash App RB",        accountType: "official_team"   as const, series: ["f1"],           isActive: true },
  // ─ F1 drivers ─
  { handle: "Max33Verstappen", displayName: "Max Verstappen",         accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "LewisHamilton",   displayName: "Lewis Hamilton",         accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "LandoNorris",     displayName: "Lando Norris",           accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "Charles_Leclerc", displayName: "Charles Leclerc",        accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "Carlossainz55",   displayName: "Carlos Sainz",           accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "alo_oficial",     displayName: "Fernando Alonso",        accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "SChecoPerez",     displayName: "Sergio Pérez",           accountType: "driver"          as const, series: ["f1"],           isActive: true },
  { handle: "GeorgeRussell63", displayName: "George Russell",         accountType: "driver"          as const, series: ["f1"],           isActive: true },
  // ─ F1 journalists ─
  { handle: "adamcooper_f1",   displayName: "Adam Cooper",            accountType: "journalist"      as const, series: ["f1"],           isActive: true },
  { handle: "ScarbsF1",        displayName: "Craig Scarborough",      accountType: "journalist"      as const, series: ["f1"],           isActive: true },
  { handle: "dieterrencken",   displayName: "Dieter Rencken",         accountType: "journalist"      as const, series: ["f1"],           isActive: true },
  { handle: "willbuxton",      displayName: "Will Buxton",            accountType: "journalist"      as const, series: ["f1"],           isActive: true },
  { handle: "SkySportsF1",     displayName: "Sky Sports F1",          accountType: "journalist"      as const, series: ["f1"],           isActive: true },
  // ─ IMSA official ─
  { handle: "IMSA",            displayName: "IMSA",                   accountType: "official_series" as const, series: ["imsa"],         isActive: true },
  { handle: "CadillacRacing",  displayName: "Cadillac Racing",        accountType: "official_team"   as const, series: ["imsa", "wec"], isActive: true },
  { handle: "PorschePenskeMS", displayName: "Porsche Penske Motorsport", accountType: "official_team" as const, series: ["imsa", "wec"], isActive: true },
  { handle: "BMWMotorsport",   displayName: "BMW M Motorsport",       accountType: "official_team"   as const, series: ["imsa", "wec"], isActive: true },
  { handle: "ActionExpressRac",displayName: "Action Express Racing",  accountType: "official_team"   as const, series: ["imsa"],         isActive: true },
  { handle: "JDCMillerMSpts",  displayName: "JDC-Miller Motorsports", accountType: "official_team"  as const, series: ["imsa"],         isActive: true },
  { handle: "PfaffMotorsports",displayName: "Pfaff Motorsports",      accountType: "official_team"   as const, series: ["imsa"],         isActive: true },
  { handle: "GenesisMR",       displayName: "Genesis Magma Racing",   accountType: "official_team"   as const, series: ["imsa", "wec"], isActive: true },
  // ─ WEC official ─
  { handle: "FIAWEC",          displayName: "FIA WEC",                accountType: "official_series" as const, series: ["wec"],          isActive: true },
  { handle: "ToyotaGazooRaceE",displayName: "Toyota Gazoo Racing",    accountType: "official_team"   as const, series: ["wec"],          isActive: true },
  { handle: "FerrariRaces",    displayName: "Ferrari Competizioni GT",accountType: "official_team"   as const, series: ["wec"],          isActive: true },
  { handle: "Porsche_Team",    displayName: "Porsche Motorsport",     accountType: "official_team"   as const, series: ["wec"],          isActive: true },
  { handle: "WRTteam",         displayName: "WRT",                    accountType: "official_team"   as const, series: ["wec", "imsa"], isActive: true },
  { handle: "JotaTeam",        displayName: "JOTA",                   accountType: "official_team"   as const, series: ["wec"],          isActive: true },
  { handle: "RadioLeMans",     displayName: "Radio Le Mans",          accountType: "journalist"      as const, series: ["wec", "imsa"], isActive: true },
  // ─ NASCAR official ─
  { handle: "NASCAR",          displayName: "NASCAR",                 accountType: "official_series" as const, series: ["nascar"],       isActive: true },
  { handle: "HendrickMotorspt",displayName: "Hendrick Motorsports",   accountType: "official_team"   as const, series: ["nascar"],       isActive: true },
  { handle: "JoeGibbsRacing",  displayName: "Joe Gibbs Racing",       accountType: "official_team"   as const, series: ["nascar"],       isActive: true },
  { handle: "TeamPenskeTweet", displayName: "Team Penske",            accountType: "official_team"   as const, series: ["nascar"],       isActive: true },
  { handle: "23XIRacing",      displayName: "23XI Racing",            accountType: "official_team"   as const, series: ["nascar"],       isActive: true },
  { handle: "TrackHouseRacing",displayName: "Trackhouse Racing",      accountType: "official_team"   as const, series: ["nascar"],       isActive: true },
  { handle: "RCKMotorsports",  displayName: "RCK Motorsports",        accountType: "official_team"   as const, series: ["nascar"],       isActive: true },
  // ─ NASCAR drivers ─
  { handle: "KyleLarsonRacr",  displayName: "Kyle Larson",            accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "DennyHamlin",     displayName: "Denny Hamlin",           accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "KyleBusch",       displayName: "Kyle Busch",             accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "JoeyLogano",      displayName: "Joey Logano",            accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "ChaseElliott",    displayName: "Chase Elliott",          accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "WilliamByron",    displayName: "William Byron",          accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "Blaney",          displayName: "Ryan Blaney",            accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "MartinTruex",     displayName: "Martin Truex Jr.",       accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "TylerReddick",    displayName: "Tyler Reddick",          accountType: "driver"          as const, series: ["nascar"],       isActive: true },
  { handle: "BubbaWallace",    displayName: "Bubba Wallace",          accountType: "driver"          as const, series: ["nascar"],       isActive: true },
];

// No sample articles — real articles come from the scraper pipeline

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding sources…");
  for (const source of SOURCES) {
    await db
      .insert(sources)
      .values(source)
      .onConflictDoUpdate({
        target: sources.id,
        set: {
          name: source.name,
          domain: source.domain,
          tier: source.tier,
          series: source.series,
        },
      });
  }
  console.log(`  ✓ ${SOURCES.length} sources`);

  console.log("Seeding X accounts…");
  for (const acct of X_ACCOUNTS) {
    await db
      .insert(xAccounts)
      .values(acct)
      .onConflictDoUpdate({
        target: xAccounts.handle,
        set: {
          displayName: acct.displayName,
          accountType: acct.accountType,
          series: acct.series,
          isActive: acct.isActive,
        },
      });
  }
  console.log(`  ✓ ${X_ACCOUNTS.length} X accounts`);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
