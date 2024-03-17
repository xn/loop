import { Item, print } from "kolmafia";
import { $item } from "libram";
import { Args, getTasks } from "grimoire-kolmafia";
import { AftercoreQuest } from "./tasks/aftercore";
import { postQuest } from "./tasks/post";
import { GyouQuest } from "./tasks/greyyou";
import { SmolQuest } from "./tasks/smol";
import { CasualQuest } from "./tasks/casual";
import { ProfitTrackingEngine } from "./engine/engine";

export const args = Args.create("loop", "A script for a full loop.", {
  actions: Args.number({
    help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
  }),
  duplicate: Args.custom(
    { help: "Item to duplicate in the Deep Machine Tunnels.", default: $item`very fancy whiskey` },
    Item.get,
    "ITEM"
  ),
  run: Args.string({
    help: "Which type of run to do for the second leg.",
    default: "casual",
    options: [
      ["none", "Stay in aftercore"],
      ["gyou", "Grey You run"],
      ["smol", "Shrunken Adventurer run"],
      ["casual", "Casual run"],
      ["custom", "Jump the gash manually"],
    ],
  }),
  jump: Args.flag({
    help: "Skip all aftercore tasks and immediately jump the gash.",
    default: false,
  }),
  pvp: Args.flag({
    help: "If true, break hippy stone and do pvp.",
    default: false,
  }),
  abort: Args.string({
    help: "If given, abort during the prepare() step for the task with matching name.",
  }),
  skipholiday: Args.flag({
    help: "If given, ignore the fact that today is a holiday.",
    default: false,
  }),
  voa: Args.number({
    help: "Value of adventure to use for garbo",
    default: 6700,
  }),
  tune: Args.string({
    help: "Moon sign to switch to after breaking prism",
    default: "wombat",
  }),
  garboCmd: Args.string({
    setting: "looploop_garboCmd",
    help: "cli command to run garbo after breaking prism",
    default: "garbo",
  }),
  garboAscendCmd: Args.string({
    setting: "looploop_garboAscendCmd",
    help: "cli command to run garbo when ascending afterwards",
    default: "garbo ascend workshed=trainset",
  }),
  freecandyOutfit: Args.string({
    help: "outfit to wear for freecandtdotexe",
    default: "Ceramic Suit",
  }),
  freecandyFamiliar: Args.string({
    help: "familiar to use for freecandtdotexe",
    default: "Jill-of-All-Trades",
  }),
  gyouCmd: Args.string({
    setting: "looploop_gyouCmd",
    help: "cli command to run loopgyou",
    default: "loopgyou tune=wombat",
  }),
  fishClan: Args.string({
    help: "clan to swap to grab carpe",
    default: "Floundry",
  }),
  floundryItem: Args.string({
    help: "Item to grab from the Floundry",
    default: "carpe",
  }),
  floundryItemAftercore: Args.string({
    help: "Item to grab from the Floundry",
    default: "carpe",
  }),
  saveFloundry: Args.boolean({
    setting: "looploop_saveFloundry",
    help: "do not acquire floundry item",
    default: true,
  }),
});
export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  const tasks = getTasks(getQuests(args.run));

  // Abort during the prepare() step of the specified task
  if (args.abort) {
    const to_abort = tasks.find((task) => task.name === args.abort);
    if (!to_abort) throw `Unable to identify task ${args.abort}`;
    to_abort.prepare = (): void => {
      throw `Abort requested`;
    };
  }

  const engine = new ProfitTrackingEngine(tasks, "loop_profit_tracker");
  try {
    engine.run(args.actions);

    // Print the next task that will be executed, if it exists
    const task = engine.getNextTask();
    if (task) {
      print(`Next: ${task.name}`, "blue");
    }

    // If the engine ran to completion, all tasks should be complete.
    // Print any tasks that are not complete.
    if (args.actions === undefined) {
      const uncompletedTasks = engine.tasks.filter((t) => !t.completed());
      if (uncompletedTasks.length > 0) {
        print("Uncompleted Tasks:");
        for (const t of uncompletedTasks) {
          print(t.name);
        }
      }
    }
  } finally {
    engine.destruct();
  }
}

function getQuests(run: string) {
  switch (run) {
    case "none":
      return [postQuest([])];
    case "gyou":
      return [
        AftercoreQuest,
        GyouQuest,
        postQuest([
          "Grey You/Ascend",
          "Grey You/Run",
          "Grey You/Level",
          "Grey You/Organ",
          "Grey You/Pull All",
        ]),
      ];
    case "smol":
      return [
        AftercoreQuest,
        SmolQuest,
        postQuest(["Smol/Ascend", "Smol/Run", "Smol/Organ", "Smol/Pull All", "Smol/Uneat"]),
      ];
    case "casual":
      return [AftercoreQuest, CasualQuest, postQuest(["Casual/Ascend", "Casual/Run"])];
    case "custom":
      return [AftercoreQuest];
    default:
      throw `Unknown run type ${run}`;
  }
}
