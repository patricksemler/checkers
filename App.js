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

export default class App extends Component {
  state = {
    // prettier-ignore
    board: [],

    turn: null,
    winner: null,
    selectedPiece: { row: null, col: null },

    homeScreenDisplay: "block",
    checkersScreenDisplay: "none",
    customizationScreenDisplay: "none",

    player1Color: "#ff3232",
    player2Color: "#323232",
    whiteBoardColor: "#eed9c4",
    blackBoardColor: "#626262",
  };

  switchToHomeScreen = () => {
    this.setState({
      homeScreenDisplay: "block",
      checkersScreenDisplay: "none",
      customizationScreenDisplay: "none",
    });
  };

  switchToCheckersScreen = () => {
    this.setState({
      homeScreenDisplay: "none",
      checkersScreenDisplay: "block",
      customizationScreenDisplay: "none",
    });

    this.resetGame();
  };

  switchToCustomizationScreen = () => {
    this.setState({
      homeScreenDisplay: "none",
      checkersScreenDisplay: "none",
      customizationScreenDisplay: "block",
    });
  };

  // Resets game to the default state
  resetGame = () => {
    this.setState({
      // prettier-ignore
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
    });

    console.log("Game reset");
  };

  // Returns a new board with updated positions, captured pieces, and kings based off the move
  applyMove = (row1, col1, row2, col2, board) => {
    if (!this.isValidMove(row1, col1, row2, col2, board)) return null; // Returns if the move is invalid

    const newBoard = board.map((row) => [...row]); // Creates new board to update the old board with
    const piece = newBoard[row1][col1];
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = piece;

    if (Math.abs(row2 - row1) == 2) {
      console.log("Capturing piece");
      newBoard[row1 + (row2 - row1) / 2][col1 + (col2 - col1) / 2] = null; // Sets old piece to null
    }

    // Checks if the piece should now be a king
    for (let i = 0; i < newBoard[0].length; i++) {
      if (newBoard[0][i] === PIECES.RED) newBoard[0][i] = PIECES.RED_KING; // Red pieces become kings when they reach the top
    }

    for (let i = 0; i < newBoard[7].length; i++) {
      if (newBoard[7][i] === PIECES.BLACK) newBoard[7][i] = PIECES.BLACK_KING; // Black pieces become kings when they reach the bottom
    }

    return newBoard;
  };

  // Updates the board with a new board, checks winners
  updateBoard = (row1, col1, row2, col2) => {
    const newBoard = this.applyMove(row1, col1, row2, col2, this.state.board);
    if (newBoard == null) return;

    const newWinner = this.checkWinner(newBoard); // Checks if a winner exists
    this.setState({
      board: newBoard,
      selectedPiece: { row: null, col: null },
      winner: newWinner,
    });

    if (newWinner != null) return; // If there's a winner, the turn doesn't need to switch

    this.switchTurn();
  };

  // Switches the turn (from red to black or black to red)
  switchTurn = () => {
    this.setState((state) => ({
      turn: state.turn === PIECES.RED ? PIECES.BLACK : PIECES.RED,
    }));
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
  isValidMove = (row1, col1, row2, col2, board) => {
    if (this.state.winner != null) {
      // If there's a winner, no moves are valid
      console.log("Game is over");
      return false;
    }

    if (!this.isSpaceAvailable(row2, col2, board)) return false;
    if (!this.isDiagonal(row1, col1, row2, col2)) return false;
    if (!this.isDirectional(row1, col1, row2, board)) return false;
    if (!this.isValidDistance(row1, col1, row2, col2, board)) return false;

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

  // Checks if the move has a capturable piece
  hasCapturablePiece = (row1, col1, row2, col2, board) => {
    const rowMid = row1 + (row2 - row1) / 2;
    const colMid = col1 + (col2 - col1) / 2;

    const piece1 = board[row1][col1];
    const piece2 = board[rowMid][colMid];

    if (piece2 == null) return false; // No piece to capture
    if (piece2.startsWith(piece1) || piece1.startsWith(piece2)) return false; // Can't capture own piece

    return true; // Move contains a capturable piece
  };

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

  generateValidMoves = (row, col, board) => {
    const validMoves = [];

    // prettier-ignore
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
          board
        )
      )
        validMoves.push({ direction });

    return validMoves;
  };

  generateCapturableMoves = (row, col, board) => {
    const validMoves = this.generateValidMoves(row, col, board);
    const capturableMoves = validMoves.filter((move) => move.hasCapture);

    return capturableMoves;
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

            <TouchableHighlight
              style={styles.button}
              onPress={this.switchToCheckersScreen}
            >
              <Text style={styles.buttonText}>Player vs. Player</Text>
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
                          piece.startsWith(this.state.turn)
                        ) {
                          this.setState({
                            selectedPiece: { row: rowIndex, col: colIndex },
                          });
                        } else {
                          if (
                            this.state.winner == null &&
                            this.state.selectedPiece.row != null
                          ) {
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
    gap: 5,
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
    fontSize: 18,
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
