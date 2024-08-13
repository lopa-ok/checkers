const board = document.getElementById('board');
const boardState = [];



for (let row = 0; row < 8; row++) {
    const rowState = [];
    for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
        square.dataset.row = row;
        square.dataset.col = col;
        board.appendChild(square);

        if (row < 3 && (row + col) % 2 !== 0) {
            const piece = document.createElement('div');
            piece.classList.add('piece', 'red');
            square.appendChild(piece);
            rowState.push('R');
        } else if (row > 4 && (row + col) % 2 !== 0) {
            const piece = document.createElement('div');
            piece.classList.add('piece', 'black-piece');
            square.appendChild(piece);
            rowState.push('B');
        } else {
            rowState.push(null);
        }
    }
    boardState.push(rowState);
}


let selectedPiece = null;

board.addEventListener('click', (e) => {
    const square = e.target.closest('.square');
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedPiece) {
        movePiece(row, col);
    } else if (boardState[row][col]) {
        selectPiece(row, col);
    }
});

function selectPiece(row, col) {
    selectedPiece = { row, col };
    const piece = board.querySelector(`.square[data-row="${row}"][data-col="${col}"] .piece`);
    if (piece) piece.classList.add('selected');
}

function movePiece(row, col) {
    if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
        const piece = board.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"] .piece`);
        board.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`).removeChild(piece);
        board.querySelector(`.square[data-row="${row}"][data-col="${col}"]`).appendChild(piece);

        boardState[row][col] = boardState[selectedPiece.row][selectedPiece.col];
        boardState[selectedPiece.row][selectedPiece.col] = null;
        selectedPiece = null;
    }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    if (!piece) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    if (colDiff !== 1 || (piece === 'R' && rowDiff !== 1) || (piece === 'B' && rowDiff !== -1)) {
        return false;
    }

    return !boardState[toRow][toCol];
}
