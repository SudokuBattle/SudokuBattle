
export const INITIAL_HP = 100;
export const PP_PER_CORRECT_REVEAL = 10;
export const ATTACK_COST_PP = 25; // Cost to initiate an attack
export const ATTACK_DAMAGE = 10; // HP damage dealt by an attack
export const GRID_SIZE = 9;

// Puzzle Set 1 (Original Easy Puzzle)
const PUZZLE_SET_1_PUZZLE: (number | null)[][] = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9],
];

const PUZZLE_SET_1_SOLUTION: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

// Puzzle Set 2
const PUZZLE_SET_2_PUZZLE: (number | null)[][] = [
  [null, null, null, null, null, 6, null, 2, null],
  [null, 1, 8, null, null, null, 7, null, null],
  [7, null, 9, null, null, 8, 1, null, null],
  [null, 7, null, 2, null, 1, null, null, 9],
  [null, null, null, null, 7, null, null, null, null],
  [6, null, null, 8, null, 9, null, 7, null],
  [null, null, 1, 9, null, null, 6, null, 7],
  [null, null, 7, null, null, null, 9, 1, null],
  [null, 6, null, 1, null, null, null, null, null]
];

const PUZZLE_SET_2_SOLUTION: number[][] = [
  [1, 5, 4, 7, 9, 6, 3, 2, 8],
  [3, 1, 8, 5, 2, 4, 7, 9, 6],
  [7, 2, 9, 3, 1, 8, 4, 6, 5],
  [4, 7, 6, 2, 3, 1, 5, 8, 9],
  [8, 9, 5, 4, 7, 6, 2, 3, 1],
  [6, 3, 2, 8, 5, 9, 1, 7, 4],
  [5, 8, 1, 9, 4, 2, 6, 3, 7],
  [2, 4, 7, 6, 8, 3, 9, 1, 5],
  [9, 6, 3, 1, 7, 5, 8, 4, 2]
];

// Puzzle Set 3
const PUZZLE_SET_3_PUZZLE: (number | null)[][] = [
  [1, null, null, 4, 8, 9, null, null, 6],
  [7, 3, null, null, null, null, null, 4, null],
  [null, null, null, null, null, 1, 2, 9, 5],
  [null, null, 7, 1, 2, null, 6, null, null],
  [5, null, null, 7, null, 3, null, null, 8],
  [null, null, 6, null, 9, 5, 7, null, null],
  [9, 1, 4, 6, null, null, null, null, null],
  [null, 2, null, null, null, null, null, 3, 7],
  [8, null, null, 5, 1, 2, null, null, 4]
];

const PUZZLE_SET_3_SOLUTION: number[][] = [
  [1, 5, 2, 4, 8, 9, 3, 7, 6],
  [7, 3, 9, 2, 5, 6, 8, 4, 1],
  [4, 6, 8, 3, 7, 1, 2, 9, 5],
  [3, 8, 7, 1, 2, 4, 6, 5, 9],
  [5, 9, 1, 7, 6, 3, 4, 2, 8],
  [2, 4, 6, 8, 9, 5, 7, 1, 3],
  [9, 1, 4, 6, 3, 7, 5, 8, 2],
  [6, 2, 5, 9, 4, 8, 1, 3, 7],
  [8, 7, 3, 5, 1, 2, 9, 6, 4]
];

export const ALL_PUZZLE_SETS: { puzzle: (number | null)[][]; solution: number[][] }[] = [
  { puzzle: PUZZLE_SET_1_PUZZLE, solution: PUZZLE_SET_1_SOLUTION },
  { puzzle: PUZZLE_SET_2_PUZZLE, solution: PUZZLE_SET_2_SOLUTION },
  { puzzle: PUZZLE_SET_3_PUZZLE, solution: PUZZLE_SET_3_SOLUTION },
];