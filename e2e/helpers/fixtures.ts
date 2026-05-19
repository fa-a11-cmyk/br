import path from "path";
import fs from "fs";

export function createTestAudioFile(): string {
  const tmpPath = path.join(process.cwd(), "e2e", "fixtures", "test-meeting.mp3");
  if (fs.existsSync(tmpPath)) return tmpPath;

  const mp3Header = Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x0a, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xfb, 0x90, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
  fs.writeFileSync(tmpPath, mp3Header);
  return tmpPath;
}

export const TEST_MEETING = {
  title: "Réunion E2E Test " + Date.now(),
  participants: "Alice, Bob",
  notes: "Test automatisé Playwright",
};

export const TEST_LANDING = {
  title: "Landing E2E Test",
  slug: `e2e-test-${Date.now()}`,
  description: "Page de test automatisé",
};
