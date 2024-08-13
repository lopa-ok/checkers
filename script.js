const board = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const undoBtn = document.getElementById('undo-btn');
const restartBtn = document.getElementById('restart-btn');
const boardState = [];
let currentPlayer = 'R'; 
let moveHistory = []; 
let selectedPiece = null;
let validMoves = [];
let noCaptureMoves = 0; 


initializeBoard();

function initializeBoard() {
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
}


board.addEventListener('click', (e) => {
    const square = e.target.closest('.square');
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedPiece) {
        if (validMoves.some(move => move.row === row && move.col === col)) {
            movePiece(row, col);
        } else {
            deselectPiece();
        }
    } else if (boardState[row][col] && boardState[row][col][0] === currentPlayer) {
        selectPiece(row, col);
    }
});

undoBtn.addEventListener('click', undoMove);
restartBtn.addEventListener('click', resetGame);

function selectPiece(row, col) {
    selectedPiece = { row, col };
    const piece = board.querySelector(`.square[data-row="${row}"][data-col="${col}"] .piece`);
    if (piece) piece.classList.add('selected');
    validMoves = getValidMoves(row, col);
    highlightValidMoves();
}

function deselectPiece() {
    if (selectedPiece) {
        const piece = board.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"] .piece`);
        if (piece) piece.classList.remove('selected');
        clearValidMoveHighlights();
        selectedPiece = null;
        validMoves = [];
    }
}

function movePiece(row, col) {
    const piece = board.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"] .piece`);
    const targetSquare = board.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);

    
    moveHistory.push(JSON.stringify(boardState));

    
    board.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`).removeChild(piece);
    targetSquare.appendChild(piece);

    
    boardState[row][col] = boardState[selectedPiece.row][selectedPiece.col];
    boardState[selectedPiece.row][selectedPiece.col] = null;

    
    const rowDiff = row - selectedPiece.row;
    if (Math.abs(rowDiff) === 2) {
        const capturedRow = selectedPiece.row + rowDiff / 2;
        const capturedCol = selectedPiece.col + (col - selectedPiece.col) / 2;
        boardState[capturedRow][capturedCol] = null;
        const capturedPiece = board.querySelector(`.square[data-row="${capturedRow}"][data-col="${capturedCol}"] .piece`);
        if (capturedPiece) capturedPiece.remove();
        noCaptureMoves = 0; 
    } else {
        noCaptureMoves++;
    }

    
    if ((row === 0 && currentPlayer === 'B') || (row === 7 && currentPlayer === 'R')) {
        piece.classList.add('king');
        boardState[row][col] += 'K'; 
    }

    
    validMoves = getValidMoves(row, col, true);
    if (validMoves.length > 0 && Math.abs(rowDiff) === 2) {
        selectedPiece = { row, col };
        highlightValidMoves();
    } else {
        
        currentPlayer = currentPlayer === 'R' ? 'B' : 'R';
        turnIndicator.textContent = `Turn: ${currentPlayer === 'R' ? 'Red' : 'Black'}`;
        deselectPiece();

        
        if (noCaptureMoves >= 50) {
            alert("It's a draw!");
            resetGame();
        }

        
        if (checkWinCondition()) {
            alert(`${currentPlayer === 'R' ? 'Black' : 'Red'} wins!`);
            resetGame();
        }
    }
}

function isValidMove(fromRow, fromCol, toRow, toCol, forCapture = false) {
    const piece = boardState[fromRow][fromCol];
    if (!piece || boardState[toRow][toCol]) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(colDiff) !== 1 && Math.abs(colDiff) !== 2) return false;

    const isKing = piece.includes('K');
    const forwardMove = currentPlayer === 'R' ? rowDiff === 1 : rowDiff === -1;
    const captureMove = Math.abs(rowDiff) === 2;

    if (!isKing && !forwardMove && !captureMove) return false;

    if (captureMove || forCapture) {
        const capturedRow = fromRow + rowDiff / 2;
        const capturedCol = fromCol + colDiff / 2;
        const capturedPiece = boardState[capturedRow][capturedCol];
        if (!capturedPiece || capturedPiece[0] === currentPlayer) return false;
    }

    return true;
}

function getValidMoves(row, col, forCapture = false) {
    const directions = [
        { dRow: -1, dCol: -1 }, { dRow: -1, dCol: 1 },
        { dRow: 1, dCol: -1 }, { dRow: 1, dCol: 1 }
    ];
    const validMoves = [];

    directions.forEach(direction => {
        const newRow = row + direction.dRow;
        const newCol = col + direction.dCol;
        if (isValidMove(row, col, newRow, newCol, forCapture)) {
            validMoves.push({ row: newRow, col: newCol });
        }
    });

    return validMoves;
}

function highlightValidMoves() {
    clearValidMoveHighlights();
    validMoves.forEach(move => {
        const square = board.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
        square.classList.add('valid-move');
    });
}

function clearValidMoveHighlights() {
    document.querySelectorAll('.valid-move').forEach(square => {
        square.classList.remove('valid-move');
    });
}

function undoMove() {
    if (moveHistory.length > 0) {
        const lastState = moveHistory.pop();
        boardState.splice(0, boardState.length, ...JSON.parse(lastState));
        redrawBoard();
        currentPlayer = currentPlayer === 'R' ? 'B' : 'R';
        turnIndicator.textContent = `Turn: ${currentPlayer === 'R' ? 'Red' : 'Black'}`;
    }
}

function redrawBoard() {
    board.querySelectorAll('.square').forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        square.innerHTML = '';
        const pieceType = boardState[row][col];
        if (pieceType) {
            const piece = document.createElement('div');
            piece.classList.add('piece', pieceType[0] === 'R' ? 'red' : 'black-piece');
            if (pieceType.includes('K')) {
                piece.classList.add('king');
            }
            square.appendChild(piece);
        }
    });
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
    moveHistory = [];
    noCaptureMoves = 0;
    initializeBoard();
}
