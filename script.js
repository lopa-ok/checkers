const board = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const undoBtn = document.getElementById('undo-btn');
const restartBtn = document.getElementById('restart-btn');
const hintBtn = document.getElementById('hint-btn');
const aiToggleBtn = document.getElementById('ai-toggle-btn');

const boardState = [];
let currentPlayer = 'R'; 
let moveHistory = []; 
let selectedPiece = null;
let validMoves = [];
let redScore = 0;
let blackScore = 0;
let timer = null;
let timeLeft = 30; 
let aiEnabled = false;
let noCaptureMoves = 0; 


initializeBoard();
startTimer();

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


board.addEventListener('click', handleBoardClick);
undoBtn.addEventListener('click', undoMove);
restartBtn.addEventListener('click', resetGame);
hintBtn.addEventListener('click', showHint);
aiToggleBtn.addEventListener('click', toggleAI);

function handleBoardClick(e) {
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
}

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

        
        if (currentPlayer === 'R') {
            redScore++;
        } else {
            blackScore++;
        }
        updateScore();
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
        resetTimer();

        
        if (noCaptureMoves >= 50) {
            alert('Draw! No captures for 50 moves.');
            resetGame();
            return;
        }

        
        if (checkWinCondition()) {
            alert(`${currentPlayer === 'R' ? 'Black' : 'Red'} wins!`);
            resetGame();
            return;
        }

        
        if (aiEnabled && currentPlayer === 'B') {
            setTimeout(makeAIMove, 1000);
        }
    }
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

function isValidMove(startRow, startCol, endRow, endCol, forCapture = false) {
    if (endRow < 0 || endRow > 7 || endCol < 0 || endCol > 7) return false;
    if (boardState[endRow][endCol]) return false;

    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    if (Math.abs(rowDiff) === 2) {
        const capturedRow = startRow + rowDiff / 2;
        const capturedCol = startCol + colDiff / 2;
        if (!boardState[capturedRow][capturedCol] || boardState[capturedRow][capturedCol][0] === currentPlayer) return false;
    }

    if (forCapture && Math.abs(rowDiff) !== 2) return false;

    if (boardState[startRow][startCol].includes('K')) return true;

    return (currentPlayer === 'R' && rowDiff < 0) || (currentPlayer === 'B' && rowDiff > 0);
}

function highlightValidMoves() {
    validMoves.forEach(move => {
        const square = board.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
        if (square) square.classList.add('valid-move');
    });
}

function clearValidMoveHighlights() {
    const squares = board.querySelectorAll('.square.valid-move');
    squares.forEach(square => square.classList.remove('valid-move'));
}

function updateScore() {
    scoreDisplay.textContent = `Red: ${redScore} - Black: ${blackScore}`;
}

function resetTimer() {
    clearInterval(timer);
    timeLeft = 30;
    timerDisplay.textContent = `Time Left: ${timeLeft}s`;
    startTimer();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert(`${currentPlayer === 'R' ? 'Black' : 'Red'} wins! Time's up!`);
            resetGame();
        }
    }, 1000);
}

function undoMove() {
    if (moveHistory.length > 0) {
        const previousState = JSON.parse(moveHistory.pop());
        boardState.length = 0;
        for (let i = 0; i < previousState.length; i++) {
            boardState[i] = previousState[i].slice();
        }
        renderBoard();
        currentPlayer = currentPlayer === 'R' ? 'B' : 'R';
        turnIndicator.textContent = `Turn: ${currentPlayer === 'R' ? 'Red' : 'Black'}`;
        resetTimer();
    }
}

function resetGame() {
    clearInterval(timer);
    board.innerHTML = '';
    boardState.length = 0;
    moveHistory.length = 0;
    selectedPiece = null;
    validMoves = [];
    redScore = 0;
    blackScore = 0;
    noCaptureMoves = 0;
    currentPlayer = 'R';
    updateScore();
    turnIndicator.textContent = 'Turn: Red';
    initializeBoard();
    startTimer();
}

function showHint() {
    const bestMove = findBestMove();
    if (bestMove) {
        const hintSquare = board.querySelector(`.square[data-row="${bestMove.row}"][data-col="${bestMove.col}"]`);
        if (hintSquare) hintSquare.classList.add('valid-move');
    }
}

function findBestMove() {
    
    const possibleMoves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (boardState[row][col] && boardState[row][col][0] === currentPlayer) {
                const moves = getValidMoves(row, col);
                if (moves.length > 0) {
                    possibleMoves.push({ row, col, moves });
                }
            }
        }
    }
    if (possibleMoves.length > 0) {
        const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        return move.moves[Math.floor(Math.random() * move.moves.length)];
    }
    return null;
}

function toggleAI() {
    aiEnabled = !aiEnabled;
    aiToggleBtn.textContent = aiEnabled ? 'Play vs Human' : 'Play vs AI';
    if (aiEnabled && currentPlayer === 'B') {
        setTimeout(makeAIMove, 1000);
    }
}

function makeAIMove() {
    const bestMove = findBestMove();
    if (bestMove) {
        const pieceSquare = board.querySelector(`.square[data-row="${bestMove.row}"][data-col="${bestMove.col}"]`);
        if (pieceSquare) {
            selectPiece(bestMove.row, bestMove.col);
            movePiece(bestMove.row, bestMove.col);
        }
    }
}

function checkWinCondition() {
    const redPieces = boardState.flat().filter(p => p && p[0] === 'R').length;
    const blackPieces = boardState.flat().filter(p => p && p[0] === 'B').length;
    return redPieces === 0 || blackPieces === 0;
}

function renderBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;
            board.appendChild(square);

            const pieceType = boardState[row][col];
            if (pieceType) {
                const piece = document.createElement('div');
                piece.classList.add('piece', pieceType[0] === 'R' ? 'red' : 'black-piece');
                if (pieceType.includes('K')) piece.classList.add('king');
                square.appendChild(piece);
            }
        }
    }
}
