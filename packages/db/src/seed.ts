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

// ─── Sample Articles (dev only) ───────────────────────────────────────────────

const now = new Date();
const h = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000); // hours ago

const SAMPLE_ARTICLES = [
  // F1
  { url: "https://www.motorsport.com/f1/news/verstappen-wins-bahrain-gp-2026/", title: "Verstappen wins Bahrain GP to open 2026 season in dominant fashion", summary: "Max Verstappen led from pole to flag in Bahrain, extending his championship lead on the opening round of the 2026 FIA Formula One World Championship. Lando Norris and Charles Leclerc completed the podium.", sourceId: "motorsport-com-f1", series: ["f1"], publishedAt: h(2), imageUrl: "https://images.unsplash.com/photo-1531685250784-7569952593d2?w=800" },
  { url: "https://the-race.com/formula-1/mclaren-mcl41-technical-analysis/", title: "McLaren MCL41 technical analysis: the details that make it so fast", summary: "Craig Scarborough breaks down the MCL41's groundbreaking rear suspension geometry and revised underfloor tunnels that have given McLaren a significant aerodynamic advantage heading into the new season.", sourceId: "the-race-f1", series: ["f1"], publishedAt: h(5), imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800" },
  { url: "https://www.autosport.com/f1/news/ferrari-sf-26-upgrade-package-spain/", title: "Ferrari confirms major SF-26 upgrade package for Spanish GP", summary: "Ferrari's technical director Loic Serra has confirmed that the Maranello squad will introduce a significant aerodynamic upgrade at the Spanish Grand Prix, targeting improved high-speed performance.", sourceId: "autosport-f1", series: ["f1"], publishedAt: h(9), imageUrl: null },
  { url: "https://www.racefans.net/2026/03/hamilton-ferrari-first-win-analysis/", title: "How Hamilton finally ended his wait for a Ferrari victory", summary: "Lewis Hamilton's maiden win in Ferrari red came in only his fourth race for the Scuderia. We examine the strategic call that made the difference in Melbourne.", sourceId: "racefans", series: ["f1"], publishedAt: h(14), isBreaking: true, imageUrl: "https://images.unsplash.com/photo-1461280360983-bd68b68a0e48?w=800" },
  // IMSA
  { url: "https://www.motorsport.com/imsa/news/cadillac-sweeps-sebring-2026/", title: "Cadillac sweeps Sebring 12 Hours podium with dominant performance", summary: "The Cadillac V-Series.R proved untouchable at Sebring, with the #10 Wayne Taylor Racing entry leading a 1-2-3 finish for the American manufacturer in the GTP class.", sourceId: "motorsport-com-imsa", series: ["imsa"], publishedAt: h(3), imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800" },
  { url: "https://www.imsa.com/news/porsche-penske-topeka-imsa-comeback/", title: "Porsche Penske Motorsport targets IMSA redemption at Mid-Ohio", summary: "After a troubled Daytona and Sebring, Porsche Penske Motorsport is banking on upgraded reliability packages for the 963 LMDh ahead of the Mid-Ohio round.", sourceId: "imsa", series: ["imsa"], publishedAt: h(7), imageUrl: null },
  { url: "https://radiolemans.com/news/bmw-m-hybrid-v8-wec-imsa-development/", title: "BMW reveals unified development program for M Hybrid V8 across WEC and IMSA", summary: "BMW M Motorsport has confirmed a shared technical program for its LMDh prototype across both the FIA WEC and IMSA WeatherTech Championship, reducing cost duplication.", sourceId: "radiolemans", series: ["imsa", "wec"], publishedAt: h(11), imageUrl: "https://images.unsplash.com/photo-1536700503589-1f3c99c72dca?w=800" },
  { url: "https://racer.com/imsa/acura-arx-06-gtd-pro-success-ballast/", title: "Acura ARX-06 teams facing success ballast for Mid-Ohio after Sebring dominance", summary: "IMSA officials have issued additional success ballast to the top Acura ARX-06 GTD Pro entries following their dominant performance at the Mobil 1 Twelve Hours of Sebring.", sourceId: "racer", series: ["imsa"], publishedAt: h(18), imageUrl: null },
  // WEC
  { url: "https://www.motorsport.com/wec/news/toyota-gazoo-racing-prologue-testing-2026/", title: "Toyota sets pace at WEC Prologue with GR010 evolution", summary: "Toyota Gazoo Racing's revised GR010 Hybrid showed strong pace at the official WEC Prologue test in Qatar, as the Japanese manufacturer prepares to defend its constructors' championship.", sourceId: "motorsport-com-wec", series: ["wec"], publishedAt: h(4), imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800" },
  { url: "https://www.fiawec.com/en/news/ferrari-499p-evo-le-mans-24h/", title: "Ferrari unveils 499P Evo specification ahead of Le Mans 24 Hours", summary: "Ferrari has revealed a comprehensive evolution of its 499P LMH prototype targeting the 2026 Le Mans 24 Hours. The updates focus on aerodynamic efficiency and thermal management.", sourceId: "fiawec", series: ["wec"], publishedAt: h(8), isBreaking: false, imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800" },
  { url: "https://the-race.com/le-mans-wec/peugeot-9x8-future-wec-decision/", title: "Peugeot to confirm 9X8 future by mid-April amid manufacturer pressure", summary: "Stellantis is expected to make a final decision on the Peugeot 9X8's future in the FIA WEC by mid-April, with pressure growing to confirm a full 2026 campaign with the revised low-downforce specification.", sourceId: "the-race-wec", series: ["wec"], publishedAt: h(20), imageUrl: null },
  { url: "https://www.dailysportscar.com/2026/03/alpine-a424-wec-improvement-test/", title: "Alpine reports 'clear improvement' from A424 test programme ahead of Qatar", summary: "Alpine Endurance Team has expressed confidence in its A424 LMDh after a productive private test in Bahrain, claiming the car's balance has been significantly improved for the 2026 FIA WEC season opener.", sourceId: "dailysportscar", series: ["wec"], publishedAt: h(26), imageUrl: null },
  // NASCAR
  { url: "https://www.nascar.com/news/larson-wins-daytona-500-2026/", title: "Kyle Larson wins the 2026 Daytona 500 in photo finish thriller", summary: "Kyle Larson held off a last-lap charge from Ryan Blaney to take his first Daytona 500 victory in a dramatic finish that required a photo-finish review. The result ends Larson's six-year wait for the Great American Race.", sourceId: "nascar", series: ["nascar"], publishedAt: h(6), isBreaking: true, imageUrl: "https://images.unsplash.com/photo-1541348263662-e068662d82af?w=800" },
  { url: "https://www.motorsport.com/nascar/news/hendrick-chevrolet-next-gen-update-2026/", title: "Hendrick Motorsports reveals Next Gen update package for 2026 season", summary: "Hendrick Motorsports has introduced a significant aero update to its Chevrolet Camaro ZL1 fleet targeting improved intermediate track performance. The changes were developed after extensive wind tunnel testing.", sourceId: "motorsport-com-nascar", series: ["nascar"], publishedAt: h(13), imageUrl: null },
  { url: "https://motorsports.nbcsports.com/nascar/denny-hamlin-23xi-racing-contract/", title: "Denny Hamlin signs contract extension with 23XI Racing through 2028", summary: "Denny Hamlin has committed his future to 23XI Racing with a multi-year extension that runs through the end of the 2028 NASCAR Cup Series season, citing the team's rapid growth and championship potential.", sourceId: "nascar-nbcsports", series: ["nascar"], publishedAt: h(22), imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800" },
  { url: "https://www.nascar.com/news/chase-elliott-martinsville-pole-2026/", title: "Chase Elliott tops qualifying at Martinsville to claim first pole of 2026", summary: "Chase Elliott set a new track record at Martinsville Speedway to claim pole position for Sunday's Cook Out 400, giving Hendrick Motorsports its first front-row start of the 2026 NASCAR Cup Series season.", sourceId: "nascar", series: ["nascar"], publishedAt: h(30), imageUrl: null },
];

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

  console.log("Seeding sample articles…");
  for (const a of SAMPLE_ARTICLES) {
    const hash = urlHash(a.url);
    await db
      .insert(articles)
      .values({
        url: a.url,
        urlHash: hash,
        title: a.title,
        summary: a.summary ?? null,
        sourceId: a.sourceId,
        series: a.series,
        publishedAt: a.publishedAt,
        imageUrl: a.imageUrl ?? null,
        isBreaking: (a as { isBreaking?: boolean }).isBreaking ?? false,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${SAMPLE_ARTICLES.length} sample articles`);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
