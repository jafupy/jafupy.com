export type Project = {
  title: string;
  description: string;
  href: string;
};

export const projects: Project[] = [
  {
    title: "Snake",
    description: "A terminal snake game running inside the emulator.",
    href: "/emulator?snake",
  },
  {
    title: "Tetris",
    description: "A terminal tetris build running inside the emulator.",
    href: "/emulator?tetris",
  },
];
