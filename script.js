const board = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const boardState = [];
let currentPlayer = 'R'; 


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
    } else if (boardState[row][col] && boardState[row][col][0] === currentPlayer) {
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

        
        const rowDiff = row - selectedPiece.row;
        if (Math.abs(rowDiff) === 2) {
            const capturedRow = selectedPiece.row + rowDiff / 2;
            const capturedCol = selectedPiece.col + (col - selectedPiece.col) / 2;
            boardState[capturedRow][capturedCol] = null;
            const capturedPiece = board.querySelector(`.square[data-row="${capturedRow}"][data-col="${capturedCol}"] .piece`);
            if (capturedPiece) capturedPiece.remove();
        }

        
        if ((row === 0 && currentPlayer === 'B') || (row === 7 && currentPlayer === 'R')) {
            piece.classList.add('king');
            boardState[row][col] += 'K'; 
        }

        
        currentPlayer = currentPlayer === 'R' ? 'B' : 'R';
        turnIndicator.textContent = `Turn: ${currentPlayer === 'R' ? 'Red' : 'Black'}`;
        selectedPiece = null;

        
        if (checkWinCondition()) {
            alert(`${currentPlayer === 'R' ? 'Black' : 'Red'} wins!`);
            resetGame();
        }
    }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    if (!piece || boardState[toRow][toCol]) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(colDiff) !== 1 && Math.abs(colDiff) !== 2) return false;

    const isKing = piece.includes('K');
    const forwardMove = currentPlayer === 'R' ? rowDiff === 1 : rowDiff === -1;
    const captureMove = Math.abs(rowDiff) === 2;

    if (!isKing && !forwardMove && !captureMove) return false;

    if (captureMove) {
        const capturedRow = fromRow + rowDiff / 2;
        const capturedCol = fromCol + colDiff / 2;
        const capturedPiece = boardState[capturedRow][capturedCol];
        if (!capturedPiece || capturedPiece[0] === currentPlayer) return false;
    }

    return true;
}

function checkWinCondition() {
    const pieces = boardState.flat();
    const redPieces = pieces.filter(p => p && p[0] === 'R');
    const blackPieces = pieces.filter(p => p && p[0] === 'B');

    return redPieces.length === 0 || blackPieces.length === 0;
}

function resetGame() {
    board.innerHTML = '';
    boardState.length = 0;
    currentPlayer = 'R';
    turnIndicator.textContent = 'Turn: Red';
    initializeBoard();
}
