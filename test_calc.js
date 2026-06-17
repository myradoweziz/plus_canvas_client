const i = 2;
const panelCount = 3;
console.log(`left: calc(-100% * ${i - 1} - 2px * ${i - 1})`);
console.log(`width: calc(100% * ${panelCount} + 2px * ${panelCount - 1})`);
