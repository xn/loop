import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  cliExecute,
  hippyStoneBroken,
  myAscensions,
  myClass,
  myStorageMeat,
  runChoice,
  storageAmount,
  toInt,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $location,
  $path,
  $skill,
  ascend,
  get,
  have,
  Lifestyle,
  Macro,
  prepareAscension,
  set,
} from "libram";
import { ascended, Quest } from "./structure";
import { args } from "../main";

export const SmolQuest: Quest = {
  name: "Smol",
  tasks: [
    {
      name: "Ascend",
      completed: () => ascended(),
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
        prepareAscension({
          eudora: "Our Daily Candles™ order form",
        });

        ascend({
          path: $path`A Shrunken Adventurer am I`,
          playerClass: $class`Seal Clubber`,
          lifestyle: Lifestyle.softcore,
          moon: "vole",
          consumable: $item`astral six-pack`,
          pet: $item`astral mask`,
        });
        if (visitUrl("main.php").includes("dense, trackless jungle")) runChoice(-1);
      },
      limit: { tries: 1 },
    },
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
      after: ["Ascend", "Break Stone"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopsmol"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Prism",
      after: ["Ascend", "Run"],
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
      name: "Organ",
      after: ["Ascend", "Prism", "Pull All"],
      completed: () => have($skill`Liver of Steel`),
      do: () => cliExecute("loopcasual goal=organ"),
      limit: { tries: 1 },
    },
    {
      name: "Duplicate",
      after: ["Ascend", "Prism", "Pull All"],
      ready: () => have(args.duplicate),
      completed: () => get("lastDMTDuplication") === myAscensions(),
      prepare: () => set("choiceAdventure1125", `1&iid=${toInt(args.duplicate)}`),
      do: $location`The Deep Machine Tunnels`,
      choices: { 1119: 4 },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: { familiar: $familiar`Machine Elf`, modifier: "muscle" },
      limit: { tries: 6 },
    },
  ],
};