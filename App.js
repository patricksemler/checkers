import React, { Component } from "react";
import {
  AppRegistry,
  Text,
  View,
  StyleSheet,
  Image,
  TextInput,
  ImageBackground,
  TouchableHighlight,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";

let deviceHeight = Dimensions.get("window").height;
let deviceWidth = Dimensions.get("window").width;

const PIECES = {
  RED: "red",
  BLACK: "black",
  RED_KING: "redKing",
  BLACK_KING: "blackKing",
};

const COLORS = {
    P1: "#ff3232",
    P2: "#323232",
};

export default class App extends Component {
  state = {
    board: [], // Keeps track of the game's board

    turn: null, // Keeps track of the current turn
    winner: null, // Keeps track of the winner (and if one exists)
    selectedPiece: { row: null, col: null }, // Keeps track of whatever piece the user selects to move
    selectedPieceLock: null, // Keeps track of if the user should be locked from selecting other pieces (i.e. capture moves exist)

    aiMode: false, // Keeps track of if the user is playing against the AI

    homeScreenDisplay: "block",
    checkersScreenDisplay: "none",
    checkersTutorialScreenDisplay: "none",
    customizationScreenDisplay: "none",

    viewedTutorial: false, // Keeps track of if the user has viewed the tutorial screen

    player1Color: COLORS.P1,
    player2Color: COLORS.P2,
    whiteBoardColor: "#eed9c4",
    blackBoardColor: "#626262",
  };

  // The following functions handle switching between screens
  switchToHomeScreen = () => {
    this.setState({
      homeScreenDisplay: "block",
      checkersScreenDisplay: "none",
      checkersTutorialScreenDisplay: "none",
      customizationScreenDisplay: "none",
    });
  };

  switchToCheckersScreen = (aiMode = false) => {
    if (!this.state.viewedTutorial) {
      this.switchToCheckersTutorialScreen(aiMode); // If they haven't viewed the tutorial, switch to the tutorial screen, and keep note of whether they're playing against AI or not
      return;
    }

    this.setState({
      homeScreenDisplay: "none",
      checkersScreenDisplay: "block",
      checkersTutorialScreenDisplay: "none",
      customizationScreenDisplay: "none",
      aiMode: aiMode, // aiMode variable keeps track of whether they're playing against AI or not
    });

    this.resetGame();
  };

  switchToCheckersTutorialScreen = (aiMode) => {
    this.setState({
      homeScreenDisplay: "none",
      checkersScreenDisplay: "none",
      checkersTutorialScreenDisplay: "block",
      customizationScreenDisplay: "none",
      viewedTutorial: true, // Sets the tutorialViewed variable to true, as reaching this screen means the user has viewed it
      aiMode: aiMode,
    });
  };

  switchToCustomizationScreen = () => {
    this.setState({
      homeScreenDisplay: "none",
      checkersScreenDisplay: "none",
      checkersTutorialScreenDisplay: "none",
      customizationScreenDisplay: "block",
    });
  };

  // Resets game to the default state
  resetGame = () => {
    this.setState({
      board: [
        [null, PIECES.BLACK, null, PIECES.BLACK, null, PIECES.BLACK, null, PIECES.BLACK],
        [PIECES.BLACK, null, PIECES.BLACK, null, PIECES.BLACK, null, PIECES.BLACK, null],
        [null, PIECES.BLACK, null, PIECES.BLACK, null, PIECES.BLACK, null, PIECES.BLACK],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null],
        [null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED],
        [PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null],
      ],
      turn: PIECES.RED,
      winner: null,
      selectedPiece: { row: null, col: null },
      selectedPieceLock: false,
    });

    console.log("Game update: Game reset");
  };

  // Resets colors to the default state
  resetColors = () => {
    this.setState({
      player1Color: COLORS.P1,
      player2Color: COLORS.P2,
    });

    console.log("Game update: Game colors reset");
  };

  // Returns a new board with updated positions, captured pieces, and kings based off the move
  applyMove = (row1, col1, row2, col2, board) => {
    if (!this.isValidMove(row1, col1, row2, col2, board)) return null; // Returns if the move is invalid

    if (!this.isCaptureWhenAvailable(row1, col1, row2, col2, board)) {
      console.log("Valid checker: A capturable move is available instead")
      return null;
    }

    const newBoard = board.map((row) => [...row]); // Creates new board to update the old board with
    const piece = newBoard[row1][col1];
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = piece;

    if (Math.abs(row2 - row1) == 2) {
      console.log("Game update: Capturing piece");
      newBoard[row1 + (row2 - row1) / 2][col1 + (col2 - col1) / 2] = null; // Sets old piece to null
    }

    // Checks if the piece should now be a king
    for (let i = 0; i < newBoard[0].length; i++) {
      if (newBoard[0][i] === PIECES.RED) { 
        console.log("Game update: Making Player 1\'s piece a king");
        newBoard[0][i] = PIECES.RED_KING; // Red pieces become kings when they reach the top 
      }
      if (newBoard[7][i] === PIECES.BLACK) {
        console.log("Game update: Making Player 2\'s piece a king");
        newBoard[7][i] = PIECES.BLACK_KING; // Black pieces become kings when they reach the bottom
      }
    }

    return newBoard;
  };

  // Applies AI move to the board
  applyAIMove = (board) => {
    if (this.state.winner != null) return; // If a winner exists, no moves should be applied

    const validMoves = this.getAllValidMoves(board, PIECES.BLACK);

    if (validMoves.length === 0) {
      console.log("AI: AI has no valid moves");
      return;
    }

    const bestMove = this.getBestMove(validMoves, board);

    this.updateBoard(
      bestMove.from.row,
      bestMove.from.col,
      bestMove.to.row,
      bestMove.to.col
    );
  };

  // Helper function to get a random move from a list of moves
  getRandomMove = (moves) => {
    const rand = Math.random();

    return moves[Math.floor(rand * moves.length)];
  };

  // Returns the best move for the AI to make based on some rules
  getBestMove = (moves, board) => {
    const captureMoves = moves.filter((move) => move.hasCapture);

    if (captureMoves.length > 0) { // Prioritize moves that capture pieces
      console.log("AI: AI capturing piece");
      return this.getRandomMove(captureMoves);
    }

    const kingMoves = moves.filter((move) => {
      const piece = board[move.from.row][move.from.col];
      return piece === PIECES.BLACK && move.to.row === 7;
    });

    if (kingMoves.length > 0) { // Prioritize moves that capture king pieces (if capture moves don't exist)
      console.log("AI: AI making king");
      return this.getRandomMove(kingMoves);
    }

    const vulnerableMoves = moves.filter((move) => {
      return this.isPieceVulnerable(move.from.row, move.from.col, board);
    });

    if (vulnerableMoves.length > 0) { // Prioritize moves that move vulnerable pieces (if capture or king moves don't exist)
      console.log("AI: AI moving vulnerable piece");
      return this.getRandomMove(vulnerableMoves);
    }

    console.log("AI: AI making normal move");
    return this.getRandomMove(moves); // Make a random move if no special moves are available
  };

  // Checks if piece is vulnerable by seeing if it is in its opponent's list of capturable moves
  isPieceVulnerable = (row, col, board) => {
    const opponent = board[row][col].startsWith(PIECES.RED)
      ? PIECES.BLACK
      : PIECES.RED;

    const opponentMoves = this.getAllValidMoves(board, opponent);
    const opponentCaptureMoves = opponentMoves.filter(
      (move) => move.hasCapture
    );

    if (opponentCaptureMoves.length === 0) return false;

    for (const move of opponentCaptureMoves) {
      if (
        move.from.row === row - (move.to.row - move.from.row) / 2 &&
        move.from.col === col - (move.to.col - move.from.col) / 2 &&
        move.to.row === row + (move.to.row - move.from.row) / 2 &&
        move.to.col === col + (move.to.col - move.from.col) / 2
      ) {
        return true;
      }
    }

    return false;
  };

  // Updates the board with a new board, checks winners
  updateBoard = (row1, col1, row2, col2) => {
    const newBoard = this.applyMove(row1, col1, row2, col2, this.state.board);
    if (newBoard == null) return;

    const validMoves = this.generateValidMoves(row2, col2, newBoard);
    const captureMoves = validMoves.filter((move) => move.hasCapture);

    const selectedPieceLock =
      captureMoves.length > 0 &&
      this.hasCapturablePiece(row1, col1, row2, col2, this.state.board);
    if (selectedPieceLock) console.log("Game update: Selection lock activated");

    const newWinner = this.checkWinner(newBoard); // Checks if a winner exists
    if (newWinner) console.log("Game update: Winner: " + newWinner);

    this.setState(
      {
        board: newBoard,
        selectedPieceLock: selectedPieceLock,
        selectedPiece: selectedPieceLock
          ? { row: row2, col: col2 }
          : { row: null, col: null },
        winner: newWinner,
        turn: selectedPieceLock
          ? this.state.turn
          : this.state.turn === PIECES.RED
            ? PIECES.BLACK
            : PIECES.RED,
      },
      () => {
        const ai = this.state.aiMode; // Check if AI mode is enabled

        if (!ai) return;

        if (this.state.turn === PIECES.BLACK) {
          setTimeout(() => {
            this.applyAIMove(newBoard); // AI makes a move if AI mode is selected
          }, 500);
        }
      }
    );
  };

  // Checks every piece on the board to see if there is a winner
  checkWinner = (board) => {
    const flattenedBoard = board.flat();

    if (
      !(
        flattenedBoard.includes(PIECES.RED) ||
        flattenedBoard.includes(PIECES.RED_KING)
      )
    )
      return PIECES.BLACK; // No red pieces, so black won
    else if (
      !(
        flattenedBoard.includes(PIECES.BLACK) ||
        flattenedBoard.includes(PIECES.BLACK_KING)
      )
    )
      return PIECES.RED; // No black pieces, so red won

    const redMoves = this.getAllValidMoves(board, PIECES.RED);
    if (redMoves.length === 0) return PIECES.BLACK;

    const blackMoves = this.getAllValidMoves(board, PIECES.BLACK);
    if (blackMoves.length === 0) return PIECES.RED;

    return null; // Both colors on board, no winner yet
  };

  // Checks if the move is valid
  isValidMove = (row1, col1, row2, col2, board, silent=false) => {
    if (this.state.winner != null) {
      // If there's a winner, no moves are valid
      if (!silent) console.log("Valid checker: Game is already over");
      return false;
    }

    if (!this.isSpaceAvailable(row2, col2, board)) { 
      if (!silent) console.log("Valid checker: Space isn\'t available");
      return false; 
    }
    if (!this.isDiagonal(row1, col1, row2, col2)) { 
      if (!silent) console.log("Valid checker: Move isn\'t diagonal");
      return false; 
    }
    if (!this.isDirectional(row1, col1, row2, board)) { 
      if (!silent) console.log("Valid checker: Move doesn\'t match the piece\'s valid directions");
      return false; 
    };
    if (!this.isValidDistance(row1, col1, row2, col2, board)) { 
      if (!silent) console.log("Valid checker: Move is too far");
      return false; 
    }

    return true;
  };

  // Checks if the space is available
  isSpaceAvailable = (row, col, board) => {
    if (
      row < 0 ||
      row > board.length - 1 ||
      col < 0 ||
      col > board[0].length - 1
    )
      return false;

    return board[row][col] == null;
  };

  // Checks if the move is diagonal
  isDiagonal = (row1, col1, row2, col2) => {
    return Math.abs(row2 - row1) === Math.abs(col2 - col1);
  };

  // Checks if the move is in the correct direction
  isDirectional = (row1, col1, row2, board) => {
    const piece = board[row1][col1];

    if (piece === PIECES.RED) {
      return row2 - row1 <= -1; // Red can only move up
    } else if (piece === PIECES.BLACK) {
      return row2 - row1 >= 1; // Black can only move down
    }

    return Math.abs(row2 - row1) >= 1; // Kings can move up or down
  };

  isCaptureWhenAvailable = (row1, col1, row2, col2, board) => {
    if (this.hasCapturablePiece(row1, col1, row2, col2, board)) return true;

    const validMoves = this.getAllValidMoves(board, this.state.turn);
    const captureMoves = validMoves.filter((move) => move.hasCapture);

    return captureMoves == 0;
  };

  // Checks if the move has a capturable piece
  hasCapturablePiece = (row1, col1, row2, col2, board) => {
    if (
      row2 < 0 ||
      row2 > board.length - 1 ||
      col2 < 0 ||
      col2 > board[0].length - 1
    )
      return false;
    if (Math.abs(row1 - row2) !== 2 || Math.abs(col1 - col2) !== 2)
      return false;

    const rowMid = row1 + (row2 - row1) / 2;
    const colMid = col1 + (col2 - col1) / 2;

    const piece1 = board[row1][col1];
    const piece2 = board[rowMid][colMid];

    if (piece2 == null || piece1 == null) return false; // No piece to capture
    if (piece2.startsWith(piece1) || piece1.startsWith(piece2)) return false; // Can't capture own piece

    return true; // Move contains a capturable piece
  };

  // Gets all valid moves for a specific player (all of their pieces)
  getAllValidMoves = (board, piece) => {
    const validMoves = [];

    const validPieces = [];
    if (piece === PIECES.RED) validPieces.push(PIECES.RED, PIECES.RED_KING);
    if (piece === PIECES.BLACK)
      validPieces.push(PIECES.BLACK, PIECES.BLACK_KING);

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (validPieces.includes(board[row][col])) {
          const moves = this.generateValidMoves(row, col, board);
          validMoves.push(...moves);
        }
      }
    }

    return validMoves;
  };

  // Generates all valid moves for a specific piece
  generateValidMoves = (row, col, board) => {
    const validMoves = [];

    const directions = [
      { from: {row: row, col: col}, to: {row: row - 1, col: col - 1}, hasCapture: false }, // Up left
      { from: {row: row, col: col}, to: {row: row - 2, col: col - 2}, hasCapture: true }, // Up left (capture)
      { from: {row: row, col: col}, to: {row: row - 1, col: col + 1}, hasCapture: false }, // Up right
      { from: {row: row, col: col}, to: {row: row - 2, col: col + 2}, hasCapture: true }, // Up right (capture)

      { from: {row: row, col: col}, to: {row: row + 1, col: col - 1}, hasCapture: false }, // Bottom left
      { from: {row: row, col: col}, to: {row: row + 2, col: col - 2}, hasCapture: true }, // Bottom left (capture)
      { from: {row: row, col: col}, to: {row: row + 1, col: col + 1}, hasCapture: false }, // Bottom right
      { from: {row: row, col: col}, to: {row: row + 2, col: col + 2}, hasCapture: true }, // Bottom right (capture)
    ];

    for (const direction of directions)
      if (
        this.isValidMove(
          direction.from.row,
          direction.from.col,
          direction.to.row,
          direction.to.col,
          board,
          true,
        )
      )
        validMoves.push({
          from: { row: direction.from.row, col: direction.from.col },
          to: { row: direction.to.row, col: direction.to.col },
          hasCapture: direction.hasCapture,
        });

    return validMoves;
  };

  // Checks if the move is a valid distance (1 or 2 spaces, depending on if a capturable piece exists)
  isValidDistance = (row1, col1, row2, col2, board) => {
    return (
      Math.abs(row1 - row2) === 1 ||
      this.hasCapturablePiece(row1, col1, row2, col2, board)
    );
  };

  // Gets the text for the checkers game updates (winner or turn)
  getCheckersUpdateText = () => {
    let winner = this.state.winner;
    let turn = this.state.turn == PIECES.RED ? 1 : 2;

    if (winner != null) {
      let winnerText = winner === PIECES.RED ? 1 : 2;

      return "Player " + winnerText + " Wins!";
    }
    return "Player " + turn + "\'s Turn";
  };

  // Gets the color for the turn
  getTurnColor = () => {
    let winner = this.state.winner;

    if (winner != null)
      return this.state.winner === PIECES.RED
        ? this.state.player1Color
        : this.state.player2Color;

    return this.state.turn === PIECES.RED
      ? this.state.player1Color
      : this.state.player2Color;
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.homeScreenDisplay === "block" && (
          <View style={styles.homeScreen}>
            <Text style={styles.titleText}>Checkers</Text>
            <Text style={styles.subTitleText}>by Patrick & Sid</Text>

            <TouchableHighlight
              style={styles.button}
              onPress={() => this.switchToCheckersScreen(false)}
            >
              <Text style={styles.buttonText}>Player vs. Player</Text>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.button}
              onPress={() => this.switchToCheckersScreen(true)}
            >
              <Text style={styles.buttonText}>Player vs. AI</Text>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.button}
              onPress={this.switchToCustomizationScreen}
            >
              <Text style={styles.buttonText}>Customization</Text>
            </TouchableHighlight>
          </View>
        )}

        {this.state.checkersScreenDisplay === "block" && (
          <View style={styles.checkersScreen}>
            <View style={styles.label}>
              <Text style={[styles.labelText, { color: this.getTurnColor() }]}>
                {this.getCheckersUpdateText()}
              </Text>
            </View>
            <View style={styles.board}>
              {this.state.board.map((row, rowIndex) => (
                <View style={styles.row} key={`row-${rowIndex}`}>
                  {row.map((piece, colIndex) => (
                    <TouchableHighlight
                      key={`col-${rowIndex}-${colIndex}`}
                      style={[
                        styles.square,
                        {
                          backgroundColor:
                            (rowIndex + colIndex) % 2 === 0
                              ? this.state.whiteBoardColor
                              : this.state.blackBoardColor,
                          borderColor: this.getTurnColor(),
                          borderWidth:
                            this.state.selectedPiece.row === rowIndex &&
                            this.state.selectedPiece.col === colIndex
                              ? 2
                              : 0,
                        },
                      ]}
                      underlayColor={this.getTurnColor()}
                      onPress={() => {
                        if (
                          piece &&
                          this.state.winner == null &&
                          !this.state.selectedPieceLock &&
                          piece.startsWith(this.state.turn) &&
                          !(
                            this.state.aiMode &&
                            this.state.turn === PIECES.BLACK
                          )
                        ) {
                          this.setState({
                            selectedPiece: { row: rowIndex, col: colIndex },
                          });
                        } else {
                          if (this.state.selectedPiece.row != null) {
                            this.updateBoard(
                              this.state.selectedPiece.row,
                              this.state.selectedPiece.col,
                              rowIndex,
                              colIndex
                            );
                          }
                        }
                      }}
                    >
                      <View style={styles.pieceView}>
                        {piece && (
                          <View
                            style={[
                              piece === PIECES.RED_KING ||
                              piece === PIECES.BLACK_KING
                                ? styles.pieceKingCircle
                                : styles.pieceCircle,
                              {
                                backgroundColor: piece.startsWith(PIECES.RED)
                                  ? this.state.player1Color
                                  : this.state.player2Color,
                              },
                            ]}
                          ></View>
                        )}
                      </View>
                    </TouchableHighlight>
                  ))}
                </View>
              ))}
            </View>
            <TouchableHighlight
              style={styles.button}
              onPress={this.switchToHomeScreen}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableHighlight>
          </View>
        )}

        {this.state.checkersTutorialScreenDisplay === "block" && (
          <View style={styles.homeScreen}>
            <Text style={styles.titleText}>Tutorial</Text>
            
            <View style={styles.tutorialBox}>
              <Text style={styles.tutorialText}>
              To move your piece, tap the piece you want to move, then tap the space you'd like to move it to.

              {"\n"}
              {"\n"}If you can capture a piece, you must do so. 
              {"\n"}To capture a piece, move your piece to the space diagonally across from the piece you want to capture. The captured piece will be removed from the board.
              {"\n"}To make a king, move your piece to the last row of the board. The circular piece will transform into a square and will be able to move in any direction.
              </Text>
            </View>

            <TouchableHighlight
              style={styles.button}
              onPress={() => this.switchToCheckersScreen(this.state.aiMode)}
            >
              <Text style={styles.buttonText}>Play</Text>
            </TouchableHighlight>
          </View>
        )}

        {this.state.customizationScreenDisplay === "block" && (
          <View style={styles.homeScreen}>
            <Text style={styles.titleText}>Customization</Text>
            <Text
              style={[styles.subTitleText, { color: this.state.player1Color }]}
            >
              Player 1's Hex Color:
            </Text>
            <TextInput
              value={this.state.player1Color}
              onChangeText={(newColor) =>
                this.setState({ player1Color: newColor })
              }
            />
            <Text
              style={[styles.subTitleText, { color: this.state.player2Color }]}
            >
              Player 2's Hex Color:
            </Text>
            <TextInput
              value={this.state.player2Color}
              onChangeText={(newColor) =>
                this.setState({ player2Color: newColor })
              }
            />
            <TouchableHighlight
              style={styles.button}
              onPress={() => {this.resetColors()}}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.button}
              onPress={this.switchToHomeScreen}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableHighlight>
          </View>
        )}
        <StatusBar style="auto" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eeeeee",
  },
  homeScreen: {
    flex: 1,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "black",
  },
  subTitleText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
  },
  tutorialText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  },
  button: {
    backgroundColor: "grey",
    width: (deviceWidth * 5) / 10,
    height: deviceHeight / 12,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 5,
  },
  label: {
    backgroundColor: "white",
    width: (deviceWidth * 5) / 12,
    height: deviceHeight / 16,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 5,
  },
  labelText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  checkersScreen: {
    flex: 1,
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  board: {
    width: (deviceWidth * 8) / 10,
    height: (deviceWidth * 8) / 10,
    flexDirection: "column",
    borderColor: "black",
    borderWidth: 5,
  },
  tutorialBox: {
    backgroundColor: "white",
    width: (deviceWidth * 10) / 12,
    height: (deviceHeight * 8) / 16,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 5,
    padding: 8,
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  square: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pieceCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderColor: "#191919",
    borderWidth: 1,
  },
  pieceKingCircle: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderColor: "#191919",
    borderWidth: 1,
  },
  pieceView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  customizationScreen: {
    flex: 1,
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});
