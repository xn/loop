import {
  cliExecute,
  fullnessLimit,
  getClanName,
  hippyStoneBroken,
  inebrietyLimit,
  myAdventures,
  myFamiliar,
  myFullness,
  myInebriety,
  mySpleenUse,
  pvpAttacksLeft,
  spleenLimit,
  use,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  Clan,
  get,
  have,
  set,
  uneffect,
} from "libram";
import { args } from "../main";
import { ascended, isHalloween, Quest, Task } from "./structure";

export function canEat(): boolean {
  return (
    myFullness() < fullnessLimit() ||
    mySpleenUse() < spleenLimit() ||
    myInebriety() < inebrietyLimit() ||
    get("currentMojoFilters") < 3
  );
}

export function stooperDrunk(): boolean {
  return (
    myInebriety() > inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myFamiliar() === $familiar`Stooper`)
  );
}

export function garboAscend(after: string[]): Task[] {
  return [
    {
      name: "Garboween",
      after: after,
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
      after: [...after, "Garboween"],
      completed: () => !isHalloween() || myAdventures() < 5 || stooperDrunk(),
      do: () => {
        cliExecute(
          `freecandy treatOutfit='${args.freecandyOutfit}' familiar='${args.freecandyFamiliar}'`
        );
      },
      limit: { tries: 1 },
      tracking: "Garbo",
    },
    {
      name: "Garbo",
      after: [...after, "Garboween", "Freecandy"],
      completed: () => (myAdventures() === 0 && !canEat()) || stooperDrunk(),
      do: () => {
        if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
          use($item`can of Rain-Doh`);
        set("valueOfAdventure", args.voa);
        cliExecute(args.garboAscendCmd);
      },
      limit: { tries: 1 },
      tracking: "Garbo",
    },
    {
      name: "Wish",
      after: [...after],
      completed: () => get("_genieWishesUsed") >= 3 || !have($item`genie bottle`),
      do: () => cliExecute(`genie wish for more wishes`),
      limit: { tries: 3 },
    },
    {
      name: "Stooper",
      after: [...after, "Garbo", "Wish"],
      do: () => cliExecute(`drink stillsuit distillate`),
      completed: () => stooperDrunk(),
      outfit: { equip: $items`mafia pinky ring`, familiar: $familiar`Stooper` },
      effects: $effects`Ode to Booze`,
      limit: { tries: 1 },
    },
    {
      name: "Overdrink",
      after: [...after, "Stooper"],
      do: () => {
        cliExecute("CONSUME NIGHTCAP");
      },
      completed: () => myInebriety() > inebrietyLimit(),
      effects: $effects`Ode to Booze`,
      limit: { tries: 3 }, // Might be too high level?
    },
    {
      name: "Overdrunk",
      after: [...after, "Overdrink"],
      prepare: () => uneffect($effect`Drenched in Lava`),
      completed: () => myAdventures() === 0 && myInebriety() > inebrietyLimit(),
      do: () => cliExecute(args.garboAscendCmd),
      limit: { tries: 1 },
      tracking: "Garbo",
    },
  ];
}

export function pvp(after: string[]): Task[] {
  return [
    {
      name: "Meteorite-Ade",
      after: [...after],
      ready: () => hippyStoneBroken(),
      do: () => use($item`Meteorite-Ade`, 3 - get("_meteoriteAdesUsed")),
      completed: () => get("_meteoriteAdesUsed") >= 3 || !args.pvp,
      limit: { tries: 1 },
    },
    {
      name: "Fights",
      after: [...after, "Meteorite-Ade"],
      ready: () => hippyStoneBroken(),
      do: () => {
        cliExecute("unequip");
        cliExecute("UberPvPOptimizer");
        cliExecute("swagger");
      },
      completed: () => pvpAttacksLeft() === 0 || !args.pvp,
      limit: { tries: 1 },
    },
  ];
}

export const AftercoreQuest: Quest = {
  name: "Aftercore",
  completed: () => ascended() || args.jump,
  tasks: [
    {
      name: "Breakfast",
      after: [],
      completed: () => get("breakfastCompleted"),
      do: () => cliExecute("breakfast"),
      limit: { tries: 1 },
    },
    {
      name: "Floundry",
      after: [],
      completed: () => get("_floundryItemCreated") || !have($item`Clan VIP Lounge key`),
      do: () => {
        const startingClan = getClanName();
        Clan.join(args.fishClan);
        cliExecute(`acquire ${args.floundryItemAftercore}`);
        Clan.join(startingClan);
      },
      limit: { tries: 1 },
    },
    ...garboAscend(["Breakfast", "Floundry"]),
    ...pvp(["Overdrunk"]),
  ],
};
