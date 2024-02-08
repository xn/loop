import { step } from "grimoire-kolmafia";
import {
  buy,
  cliExecute,
  hippyStoneBroken,
  inebrietyLimit,
  itemAmount,
  myFullness,
  myInebriety,
  myPath,
  myStorageMeat,
  retrieveItem,
  runChoice,
  storageAmount,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $item,
  $path,
  $skill,
  ascend,
  get,
  getRemainingLiver,
  getRemainingStomach,
  have,
  Lifestyle,
  prepareAscension,
} from "libram";
import { ascended, Quest } from "./structure";
import { args } from "../main";

export const SmolQuest: Quest = {
  name: "Smol",
  tasks: [
    {
      name: "Legend Pizza",
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      completed: () => itemAmount($item`Pizza of Legend`) >= 10 || ascended(),
      do: () => retrieveItem(10, $item`Pizza of Legend`),
      limit: { tries: 1 },
    },
    {
      name: "Ascend",
      completed: () => ascended(),
      after: ["Aftercore/Overdrunk", "Aftercore/Fights", "Legend Pizza"],
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
      completed: () => myPath() !== $path`A Shrunken Adventurer am I`,
      do: () => visitUrl("place.php?whichplace=nstower&action=ns_11_prism"),
      limit: { tries: 1 },
      tracking: "Ignore",
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
      name: "Uneat",
      after: ["Ascend", "Prism", "Pull All"],
      completed: () =>
        (getRemainingStomach() >= 0 && getRemainingLiver() >= 0) ||
        myInebriety() > inebrietyLimit() + 5,
      do: (): void => {
        if (myFullness() >= 3 && myInebriety() >= 3 && !get("spiceMelangeUsed")) {
          if (!have($item`spice melange`)) buy($item`spice melange`, 1, 600000);
          use($item`spice melange`);
        }
        if (getRemainingStomach() < 0 && get("_augSkillsCast") < 5 && !get("_aug16Cast")) {
          useSkill($skill`Aug. 16th: Roller Coaster Day!`);
        }
        if (
          getRemainingStomach() < 0 &&
          have($item`distention pill`) &&
          !get("_distentionPillUsed")
        ) {
          use($item`distention pill`);
        }
        if (
          getRemainingLiver() < 0 &&
          have($item`synthetic dog hair pill`) &&
          !get("_syntheticDogHairPillUsed")
        ) {
          use($item`synthetic dog hair pill`);
        }
        if (getRemainingLiver() < 0 && !get("_sobrieTeaUsed")) {
          if (!have($item`cuppa Sobrie tea`)) buy($item`cuppa Sobrie tea`, 100000);
          use($item`cuppa Sobrie tea`);
        }
      },
      limit: { tries: 1 },
    },
    {
      name: "Organ",
      after: ["Ascend", "Prism", "Pull All", "Uneat"],
      completed: () => have($skill`Liver of Steel`),
      do: () => cliExecute("loopcasual goal=organ"),
      limit: { tries: 1 },
    },
  ],
};
