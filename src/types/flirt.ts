import { Step } from "@/generated/prisma";

export interface Flirt {
  id: string;
  title: string;
  author: { email: string };
  steps: Step[];
}