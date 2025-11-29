class Cell {
  constructor(row, col, value = null) {
    this.row = row;
    this.col = col;
    this.value = value;
    this.candidates = [];
  }

  calculateCandidates(cells) {
    if (this.value !== null) {
      this.candidates = [];
      return;
    }

    const usedNumbers = new Set();
    // Check row and column
    for (let i = 0; i < 9; i++) {
      if (cells[this.row][i].value !== null) {
        usedNumbers.add(cells[this.row][i].value);
      }
      if (cells[i][this.col].value !== null) {
        usedNumbers.add(cells[i][this.col].value);
      }
    }
    // Check 3x3 box
    const boxRowStart = Math.floor(this.row / 3) * 3;
    const boxColStart = Math.floor(this.col / 3) * 3;
    for (let r = boxRowStart; r < boxRowStart + 3; r++) {
      for (let c = boxColStart; c < boxColStart + 3; c++) {
        if (cells[r][c].value !== null) {
          usedNumbers.add(cells[r][c].value);
        }
      }
    }
    this.candidates = [];
    for (let num = 1; num <= 9; num++) {
      if (!usedNumbers.has(num)) {
        this.candidates.push(num);
      }
    }
  }
}

export default Cell;
