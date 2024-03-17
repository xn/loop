import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  autosell,
  buy,
  buyUsingStorage,
  cliExecute,
  descToItem,
  getClanName,
  getFuel,
  getWorkshed,
  hippyStoneBroken,
  itemAmount,
  mallPrice,
  myAscensions,
  myAdventures,
  myClass,
  myFamiliar,
  myLevel,
  myStorageMeat,
  print,
  pullsRemaining,
  runChoice,
  storageAmount,
  totalTurnsPlayed,
  toInt,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $path,
  $skill,
  ascend,
  AsdonMartin,
  Clan,
  ensureEffect,
  get,
  getTodaysHolidayWanderers,
  have,
  Lifestyle,
  Macro,
  Pantogram,
  prepareAscension,
  realmAvailable,
  RetroCape,
  set,
  SourceTerminal,
} from "libram";
import { ascended, Quest, Task } from "./structure";
import { args } from "../main";

const gear: Task[] = [
  {
    name: "Pants",
    after: [],
    completed: () => have($item`pantogram pants`) || !have($item`portable pantogram`),
    do: () => {
      if (step("questM05Toot") === -1) visitUrl("council.php");
      if (step("questM05Toot") === 0) visitUrl("tutorial.php?action=toot");
      if (have($item`letter from King Ralph XI`)) use($item`letter from King Ralph XI`);
      if (have($item`pork elf goodies sack`)) use($item`pork elf goodies sack`);
      if (!have($item`porquoise`)) {
        if (storageAmount($item`porquoise`) === 0) buyUsingStorage($item`porquoise`);
        cliExecute("pull 1 porquoise");
      }
      Pantogram.makePants(
        "Muscle",
        "Stench Resistance: 2",
        "Maximum MP: 20",
        "Combat Rate: 5",
        "Meat Drop: 60"
      );
      autosell($item`hamethyst`, itemAmount($item`hamethyst`));
      autosell($item`baconstone`, itemAmount($item`baconstone`));
    },
    limit: { tries: 1 },
  },
  {
    name: "Lucky Gold Ring",
    after: [],
    completed: () => have($item`lucky gold ring`),
    do: () => cliExecute("pull lucky gold ring"),
    limit: { tries: 1 },
  },
  {
    name: "Floundry",
    after: [],
    completed: () =>
      get("_floundryItemCreated") || !have($item`Clan VIP Lounge key`) || args.saveFloundry,
    do: () => {
      const startingClan = getClanName();
      Clan.join(args.fishClan);
      cliExecute(`acquire ${args.floundryItem}`);
      Clan.join(startingClan);
    },
    limit: { tries: 1 },
  },
  // {
  //   name: "Pointer Finger",
  //   after: [],
  //   completed: () => have($item`mafia pointer finger ring`),
  //   do: () => cliExecute("pull mafia pointer finger ring"),
  //   limit: { tries: 1 },
  // },
];

export const GyouQuest: Quest = {
  name: "Grey You",
  tasks: [
    {
      name: "Ascend",
      completed: () => ascended(),
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
        const garden = "packet of rock seeds";
        const eudora = "Our Daily Candles™ order form";
        prepareAscension({ garden, eudora });

        ascend({
          path: $path`Grey You`,
          playerClass: $class`Grey Goo`,
          lifestyle: Lifestyle.softcore,
          moon: "vole",
          consumable: $item`astral six-pack`,
          pet: $item`astral pistol`,
        });
        if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
          runChoice(-1);
      },
      limit: { tries: 1 },
    },
    ...gear,
    {
      name: "Break Stone",
      completed: () => hippyStoneBroken() || !args.pvp,
      do: (): void => {
        visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
        visitUrl("peevpee.php?place=fight");
      },
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend", ...gear.map((task) => task.name)],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute(args.gyouCmd),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Tune Moon",
      after: ["Ascend", "Run", ...gear.map((task) => task.name)],
      completed: () =>
        !have($item`hewn moon-rune spoon`) || args.tune === undefined || get("moonTuned", false),
      do: () => cliExecute(`spoon ${args.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "In-Run Farm",
      after: ["Ascend", "Run", "Tune Moon", ...gear.map((task) => task.name)],
      completed: () => myAdventures() <= 40 || myClass() !== $class`Grey Goo`,
      do: $location`Barf Mountain`,
      acquire: [{ item: $item`wad of used tape` }],
      prepare: (): void => {
        print("In prepare");
        RetroCape.tuneToSkill($skill`Precision Shot`);
        const ticket = $item`one-day ticket to Dinseylandfill`;
        print("before buy/pull ticket");
        if (!realmAvailable("stench") && (have(ticket) || pullsRemaining() > 0)) {
          const TICKET_MAX_PRICE = 500000;

          if (!have(ticket)) {
            print("in buy");
            buy(1, ticket, TICKET_MAX_PRICE);
            cliExecute(`pull ${ticket.name}`);
          }
          use(ticket);
        }
        print("ticket bought and used");
        if (realmAvailable("stench")) {
          print("dinsey avail");
        }
        const scams = $item`How to Avoid Scams`;
        if (!have(scams) && pullsRemaining() > 0) {
          cliExecute(`pull ${scams.name}`);
        }

        if (have(scams)) ensureEffect($effect`How to Scam Tourists`);

        // Use only the first source terminal enhance, save the others for aftercore
        if (SourceTerminal.have() && get("_sourceTerminalEnhanceUses") === 0)
          SourceTerminal.enhance($effect`meat.enh`);

        // Prepare latte
        if (
          have($item`latte lovers member's mug`) &&
          !get("latteModifier").includes("Meat Drop: 40") &&
          get("_latteRefillsUsed") < 2
        ) {
          const modifiers = [];
          if (get("latteUnlocks").includes("wing")) modifiers.push("wing");
          if (get("latteUnlocks").includes("cajun")) modifiers.push("cajun");
          modifiers.push("cinnamon", "pumpkin", "vanilla");
          cliExecute(`latte refill ${modifiers.slice(0, 3).join(" ")}`); // Always unlocked
        }

        // Swap to asdon when all extrovermectins are done
        if (
          have($item`Asdon Martin keyfob`) &&
          getWorkshed() === $item`cold medicine cabinet` &&
          get("_coldMedicineConsults") >= 5
        ) {
          use($item`Asdon Martin keyfob`);
        }

        // Prepare Asdon buff
        if (AsdonMartin.installed() && !have($effect`Driving Observantly`)) {
          if (getFuel() < 37 && itemAmount($item`wad of dough`) < 8) {
            // Get more wads of dough. We must do this ourselves since
            // retrieveItem($item`loaf of soda bread`) in libram will not
            // consider all-purpose flower.
            buy($item`all-purpose flower`);
            use($item`all-purpose flower`);
          }
          AsdonMartin.drive(AsdonMartin.Driving.Observantly);
        }
      },
      post: getExtros,
      outfit: {
        back: $item`unwrapped knock-off retro superhero cape`,
        weapon: $item`astral pistol`,
        offhand: $item`latte lovers member's mug`,
        acc1: $item`lucky gold ring`,
        // acc2: $item`mafia pointer finger ring`,
        acc3: $item`mafia thumb ring`,
        familiar: $familiar`Hobo Monkey`,
        modifier: "meat",
      },
      combat: new CombatStrategy()
        .macro(Macro.skill($skill`Infinite Loop`), getTodaysHolidayWanderers())
        .macro(() =>
          Macro.tryItem($item`train whistle`)
            .trySkill($skill`Bowl Straight Up`)
            .trySkill($skill`Sing Along`)
            .trySkill($skill`Extract Jelly`)
            .tryItem($item`porquoise-handled sixgun`)
            .externalIf(
              myFamiliar() === $familiar`Hobo Monkey`,
              Macro.while_(
                `!match "shoulder, and hands you some Meat." && !pastround 20 && !hppercentbelow 25`,
                Macro.item($item`seal tooth`)
              )
            )
            .trySkill($skill`Double Nanovision`)
            .attack()
            .repeat()
        )
        .macro(
          new Macro()
            .while_("!mpbelow 20", new Macro().skill($skill`Double Nanovision`))
            .attack()
            .repeat(),
          $monster`sausage goblin`
        ),
      limit: { tries: 550 },
      tracking: "GooFarming",
    },
    {
      name: "Prism",
      after: ["Ascend", "Run", "In-Run Farm"],
      completed: () => myClass() !== $class`Grey Goo`,
      do: () => cliExecute("loopgyou class=1"),
      limit: { tries: 1 },
    },
    {
      name: "Pull All",
      after: ["Ascend", "Prism"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`festive warbear bank`) === 0, // arbitrary item,
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Level",
      after: ["Ascend", "Prism", "Pull All"],
      completed: () => myClass() !== $class`Grey Goo` && myLevel() >= 13,
      do: () => cliExecute("levelup targetlevel=13"),
      limit: { tries: 1 },
    },
    {
      name: "Organ",
      after: ["Ascend", "Prism", "Level", "Pull All"],
      completed: () => have($skill`Liver of Steel`),
      do: () => cliExecute("loopcasual goal=organ"),
      limit: { tries: 1 },
    },
  ],
};

function getExtros(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;
  if (get("_coldMedicineConsults") >= 5 || get("_nextColdMedicineConsult") > totalTurnsPlayed()) {
    return;
  }
  const options = visitUrl("campground.php?action=workshed");
  let match;
  const regexp = /descitem\((\d+)\)/g;
  while ((match = regexp.exec(options)) !== null) {
    const item = descToItem(match[1]);
    if (item === $item`Extrovermectin™`) {
      visitUrl("campground.php?action=workshed");
      runChoice(5);
      return;
    }
  }
}
