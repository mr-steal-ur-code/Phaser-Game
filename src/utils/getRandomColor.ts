export default function getRandomSoftColor(): string {
  const colors = [
    "#f3eac2", // Soft yellow
    "#e0f7fa", // Light cyan
    "#d1c4e9", // Lavender
    "#c8e6c9", // Mint green
    "#ffccbc", // Peach
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}