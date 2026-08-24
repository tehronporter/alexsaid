import { spawn } from "node:child_process";

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)));
  });
}

await run("npm", ["run", "content:compile"]);
await run("npm", ["run", "content:validate:release"]);
await run("npm", ["run", "content:audit-links"]);
await run("npm", ["run", "content:coverage"]);
