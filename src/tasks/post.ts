import { CombatStrategy } from "grimoire-kolmafia";
import {
  buy,
  cliExecute,
  getWorkshed,
  haveEffect,
  inebrietyLimit,
  itemAmount,
  mallPrice,
  myAdventures,
  myAscensions,
  myInebriety,
  toInt,
  use,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  ChateauMantegna,
  get,
  have,
  haveInCampground,
  Macro,
  set,
} from "libram";
import { drive } from "libram/dist/resources/2017/AsdonMartin";
import { isHalloween, Quest } from "./structure";
import { args } from "../main";
import { canEat, pvp, stooperDrunk } from "./aftercore";

export function postQuest(runTasks: string[]): Quest {
  return {
    name: "Post",
    tasks: [
      {
        name: "Workshed",
        after: runTasks,
        completed: () => getWorkshed() === $item`cold medicine cabinet` || get("_workshedItemUsed"),
        do: (): void => {
          if (
            haveEffect($effect`Driving Observantly`) < 900 &&
            getWorkshed() === $item`Asdon Martin keyfob`
          )
            drive($effect`Driving Observantly`, 900);
          use($item`cold medicine cabinet`);
        },
        limit: { tries: 1 },
      },
      {
        name: "garden",
        after: runTasks,
        completed: () => !have($item`packet of mushroom spores`),
        do: (): void => {
          use($item`packet of mushroom spores`);
        },
        limit: { tries: 1 },
      },
      {
        name: "Tune Moon",
        after: runTasks,
        completed: () =>
          !have($item`hewn moon-rune spoon`) || args.tune === undefined || get("moonTuned", false),
        do: () => cliExecute(`spoon ${args.tune}`),
        limit: { tries: 1 },
      },
      {
        name: "Duplicate",
        after: runTasks,
        ready: () => have(args.duplicate) && myAdventures() > 0,
        completed: () =>
          !have($familiar`Machine Elf`) || get("lastDMTDuplication") === myAscensions(),
        prepare: (): void => {
          let duped = $item`none`;
          const dupeItems = $items`pickled bread, corned beet, salted mutton, chocomotive, cabooze, freightcake, very fancy whiskey, bottle of Greedy Dog, liquid rhinestones, Daily Affirmation: Always be Collecting, Daily Affirmation: Work For Hours a Week, huge Crimbo cookie, green-iced sweet roll, bottle of Race Car Red, warbear gyro, karma shawarma, bottle of drinkin' gas, abstraction: comprehension, Daily Affirmation: Think Win-Lose, bottle of Old Pugilist`;
          const dupeVals = Array.from(dupeItems.values()).map((dupe) => {
            return {
              dupeIt: dupe,
              value: mallPrice(dupe),
            };
          });
          const best = dupeVals.sort((a, b) => b.value - a.value)[0];
          duped = best.dupeIt;
          if (itemAmount(duped) === 0) {
            buy(duped, 1);
          }
          set("choiceAdventure1125", `1&iid=${toInt(best.dupeIt)}`);
        },
        do: $location`The Deep Machine Tunnels`,
        choices: { 1119: 4 },
        combat: new CombatStrategy().macro(new Macro().attack().repeat()),
        outfit: { familiar: $familiar`Machine Elf`, modifier: "muscle" },
        limit: { tries: 6 },
      },
      {
        name: "Breakfast",
        after: runTasks,
        completed: () => get("breakfastCompleted"),
        do: () => cliExecute("breakfast"),
        limit: { tries: 1 },
      },
      {
        name: "Garboween",
        after: [...runTasks, "Workshed", "Duplicate", "Breakfast"],
        completed: () => !isHalloween() || !canEat() || stooperDrunk(),
        do: () => {
          set("valueOfAdventure", 20000);
          cliExecute("garboween");
          set("valueOfAdventure", args.voa);
        },
        limit: { tries: 1 },
        tracking: "Garbo",
      },
      {
        name: "Freecandy",
        after: [...runTasks, "Workshed", "Duplicate", "Breakfast", "Garboween"],
        completed: () => !isHalloween() || myAdventures() < 5 || stooperDrunk(),
        do: () => {
          cliExecute("freecandy treatOutfit='Ceramic Suit' familiar='Red-Nosed Snapper'");
        },
        outfit: { familiar: $familiar`Red-Nosed Snapper` },
        limit: { tries: 1 },
        tracking: "Garbo",
      },
      {
        name: "Garbo",
        after: [...runTasks, "Garboween", "Freecandy", "Workshed", "Duplicate", "Breakfast"],
        completed: () => (myAdventures() === 0 && !canEat()) || stooperDrunk(),
        do: (): void => {
          if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
            use($item`can of Rain-Doh`);
          set("valueOfAdventure", args.voa);
          cliExecute(args.garboCmd);
        },
        limit: { tries: 1 },
        tracking: "Garbo",
      },
      {
        name: "Wish",
        after: runTasks,
        completed: () => get("_genieWishesUsed") >= 3 || !have($item`genie bottle`),
        do: () => cliExecute(`genie wish for more wishes`),
        limit: { tries: 3 },
      },
      {
        name: "Nightcap",
        after: [...runTasks, "Garbo", "Wish"],
        completed: () => myInebriety() > inebrietyLimit(),
        do: () => cliExecute("CONSUME NIGHTCAP"),
        limit: { tries: 1 },
      },
      ...pvp(["Nightcap"]),
      {
        name: "Chateau Sleep",
        after: [...runTasks, "Nightcap", "Fights"],
        completed: () =>
          !ChateauMantegna.have() || ChateauMantegna.getCeiling() === "artificial skylight",
        do: () => ChateauMantegna.changeCeiling("artificial skylight"),
        limit: { tries: 1 },
      },
      {
        name: "Scepter",
        after: [...runTasks, "Nightcap", "Fights"],
        completed: () => get("_augSkillsCast", 0) >= 5 || have($effect`Offhand Remarkable`),
        do: () => useSkill($skill`Aug. 13th: Left/Off Hander's Day!`),
        limit: { tries: 1 },
      },
      {
        name: "Sleep",
        completed: () => haveInCampground($item`clockwork maid`),
        after: [...runTasks, "Nightcap", "Fights"],
        acquire: [{ item: $item`burning cape`, optional: true }],
        do: (): void => {
          if (!haveInCampground($item`clockwork maid`)) {
            if (!have($item`clockwork maid`)) buy(1, $item`clockwork maid`, 48000);
            use($item`clockwork maid`);
          }
        },
        outfit: { modifier: "adv", familiar: $familiar`Left-Hand Man` },
        limit: { tries: 1 },
      },
    ],
  };
}
