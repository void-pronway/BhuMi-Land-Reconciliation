// Deliberately public credentials for fictional competition records only.
export const DEMO_ACCOUNT = {
  id: "b4700000-0000-4000-8000-000000000001",
  email: "judge@bhumi.demo",
  password: "BhuMi-Judge-Demo-2026!",
} as const;
export function demoAccessEnabled() {
  return (
    process.env.SEED_DEMO !== "false" &&
    process.env.PUBLIC_DEMO_ACCESS !== "false"
  );
}
