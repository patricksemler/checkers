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
  };

  // Moves piece from position A to position B
  movePiece = (row1, col1, row2, col2) => {
    if (!this.isValidMove(row1, col1, row2, col2)) return; // Returns if the move is invalid

    const board = this.state.board;

    // prettier-ignore
    const capturablePiece = this.hasCapturablePiece(row1, col1, row2, col2, board); // Finds capturable piece if one exists

    const newBoard = board.map((row) => [...row]); // Creates new board to update the old board with
    const piece = newBoard[row1][col1];
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = piece;

    if (capturablePiece) {
      console.log("Capturing piece");
      newBoard[row1 + (row2 - row1) / 2][col1 + (col2 - col1) / 2] = null; // Sets old piece to null
    } else {
      console.log("No capture");
    }

    // Checks if the piece should now be a king
    for (let i = 0; i < newBoard[0].length; i++) {
      if (newBoard[0][i] === PIECES.RED) newBoard[0][i] = PIECES.RED_KING; // Red pieces become kings when they reach the top
    }

    for (let i = 0; i < newBoard[7].length; i++) {
      if (newBoard[7][i] === PIECES.BLACK) newBoard[7][i] = PIECES.BLACK_KING; // Black pieces become kings when they reach the bottom
    }

    const newWinner = this.checkWinner(newBoard); // Checks if a winner exists

    // Updates the state with the new board, selected piece, and winner
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

    return null; // Both colors on board, no winner yet
  };

  // Checks if the move is valid
  isValidMove = (row1, col1, row2, col2) => {
    if (this.state.winner != null) {
      // If there's a winner, no moves are valid
      console.log("Game is over");
      return false;
    }

    const board = this.state.board;

    // prettier-ignore
    const checks = [
      {condition: this.isCorrectTurn(row1, col1, board), message: "Incorrect turn"},
      {condition: this.isSpaceAvailable(row2, col2, board), message: "Space is not available"},
      {condition: this.isDiagonal(row1, col1, row2, col2), message:  "Move is not diagonal"},
      {condition: this.isDirectional(row1, col1, row2, board), message: "Move is not directional"},
      {condition: this.isValidDistance(row1, col1, row2, col2, board), message: "Move is not valid distance"},
    ];

    // Loops through each condition and returns false if any are false, logging to console as well
    for (const check of checks) {
      if (!check.condition) {
        console.log(check.message);
        return false;
      }
    }

    return true; // All conditions passed
  };

  // Checks if the piece is the correct turn
  isCorrectTurn = (row, col, board) => {
    return (
      this.state.winner == null && board[row][col].startsWith(this.state.turn)
    );
  };

  // Checks if the space is available
  isSpaceAvailable = (row, col, board) => {
    return board[row][col] === null;
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
    if (Math.abs(row1 - row2) != 2 || Math.abs(col1 - col2) != 2) return false; // Can't capture if not moving 2 spaces

    const rowMid = row1 + (row2 - row1) / 2;
    const colMid = col1 + (col2 - col1) / 2;

    const piece1 = board[row1][col1];
    const piece2 = board[rowMid][colMid];

    if (piece2 == null) return false; // No piece to capture
    if (piece2.startsWith(piece1) || piece1.startsWith(piece2)) return false; // Can't capture own piece

    return true; // Move contains a capturable piece
  };

  // Checks if the move is a valid distance (1 or 2 spaces, depending on if a capturable piece exists)
  isValidDistance = (row1, col1, row2, col2, board) => {
    return (
      this.hasCapturablePiece(row1, col1, row2, col2, board) ||
      Math.abs(row1 - row2) === 1
    );
  };

  // Gets the emoji text for the piece
  getPieceEmojiText = (piece) => {
    switch (piece) {
      case PIECES.RED:
        return "🔴";
      case PIECES.RED_KING:
        return "🟥";
      case PIECES.BLACK:
        return "⚫";
      case PIECES.BLACK_KING:
        return "⬛️";
      default:
        return "";
    }
  };

  // Gets the text for the checkers game updates (winner or turn)
  getCheckersUpdateText = () => {
    if (this.state.winner != null) {
      return (
        this.state.winner.charAt(0).toUpperCase() +
        this.state.winner.slice(1) +
        " Wins!"
      );
    }

    return (
      this.state.turn.charAt(0).toUpperCase() +
      this.state.turn.slice(1) +
      "\'s Turn"
    );
  };

  // Gets the color for the turn
  getTurnColor = () => {
    return this.state.turn === PIECES.RED ? "red" : "black";
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.chessScreen}>
          <View style={styles.board}>
            {this.state.board.map((row, rowIndex) => (
              <View style={styles.row}>
                {row.map((piece, colIndex) => (
                  <TouchableHighlight
                    style={[
                      styles.square,
                      {
                        backgroundColor:
                          (rowIndex + colIndex) % 2 === 0
                            ? "#eed9c4"
                            : "#3b3b3b",
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
                      if (piece && piece.startsWith(this.state.turn)) {
                        this.setState({
                          selectedPiece: { row: rowIndex, col: colIndex },
                        });
                      } else {
                        if (this.state.selectedPiece.row != null) {
                          this.movePiece(
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
                        <Text style={styles.piece}>
                          {this.getPieceEmojiText(piece)}
                        </Text>
                      )}
                    </View>
                  </TouchableHighlight>
                ))}
              </View>
            ))}
          </View>

          <Text
            style={[styles.checkersUpdateText, { color: this.getTurnColor() }]}
          >
            {this.getCheckersUpdateText()}
          </Text>
        </View>

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
  mainMenuScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chessScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
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
  piece: {
    fontSize: 24,
    textShadowColor: "black",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  pieceView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkersUpdateText: {
    fontSize: 30,
    fontWeight: "bold",
  },
});
