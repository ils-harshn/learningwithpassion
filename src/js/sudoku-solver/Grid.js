class Grid {
  constructor(cells, method = "backtracking") {
    this.cells = cells;
    this.iterations = 0;
    this.method = method;
  }

  getNextEmptyCell() {
    if (this.method === "leastentropies") {// Find cell with fewest candidates
      let minCandidates = 10;
      let targetCell = null;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          const cell = this.cells[i][j];
          if (cell.value === null) {
            cell.calculateCandidates(this.cells);
            if (cell.candidates.length < minCandidates) {
              minCandidates = cell.candidates.length;
              targetCell = cell;
            }
          }
        }
      }
      return targetCell;
    } else {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (this.cells[i][j].value === null) {
            return this.cells[i][j];
          }
        }
      }
    }
    return null;
  }

  solve() {
    const empty = this.getNextEmptyCell();
    if (!empty) return true; // solved
    if (this.method === "backtracking") empty.calculateCandidates(this.cells);
    this.iterations++;
    for (let i = 0; i < empty.candidates.length; i++) {
      const originalCandidates = empty.candidates;
      empty.value = originalCandidates[i];
      empty.candidates = [];
      if (this.solve()) return true;
      empty.value = null;
      empty.candidates = originalCandidates;
    }

    return false;
  }

  *animateSolveGenerator() {
    const empty = this.getNextEmptyCell();
    if (!empty) return true; // solved

    if (this.method === "backtracking") empty.calculateCandidates(this.cells);
    this.iterations++;

    for (let cand of empty.candidates) {
      empty.value = cand;
      yield; // 🔥 IMPORTANT: yield after each step/frame

      if (yield* this.animateSolveGenerator()) {
        return true;
      }

      empty.value = null;
      yield;
    }

    return false;
  }
}

export default Grid;
