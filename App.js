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
    selectedPieceLock: null,

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
        [null, null, null, null, PIECES.BLACK_KING, null, null, null],
        [null, null, null, null, null, null, PIECES.RED_KING, null],
        [PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null],
        [null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED],
        [PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null],
      ],
      turn: PIECES.RED,
      winner: null,
      selectedPiece: { row: null, col: null },
      selectedPieceLock: false,
    });

    console.log("Game reset");
  };

  // Moves piece from position A to position B
  movePiece = (row1, col1, row2, col2) => {
    if (!this.isValidMove(row1, col1, row2, col2)) return; // Returns if the move is invalid

    const board = this.state.board;

    // prettier-ignore
    const capturablePiece = this.hasCapturablePiece(row1, col1, row2, col2, board); // Finds capturable piece if one exists

    if (
      this.state.selectedPieceLock &&
      !capturablePiece &&
      this.hasAnyCapturablePieces(row1, col1, board)
    ) {
      console.log("Capturable piece exists, move blocked");
      return; // Forces the player to capture if a capturable piece exists
    }

    const newBoard = board.map((row) => [...row]); // Creates new board to update the old board with
    const piece = newBoard[row1][col1];
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = piece;

    if (capturablePiece) {
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

    const newWinner = this.checkWinner(newBoard); // Checks if a winner exists

    // Updates the state with the new board, selected piece, and winner
    this.setState({
      board: newBoard,
      selectedPiece: { row: null, col: null },
      winner: newWinner,
    });

    if (newWinner != null) return; // If there's a winner, the turn doesn't need to switch

    if (capturablePiece && this.hasAnyCapturablePieces(row2, col2, newBoard)) {
      this.setState({
        selectedPiece: { row: row2, col: col2 },
        selectedPieceLock: true,
      });
      return; // If there are still capturable pieces remaining, the turn can continue
    }

    this.switchTurn();
  };

  // Switches the turn (from red to black or black to red)
  switchTurn = () => {
    this.setState((state) => ({
      turn: state.turn === PIECES.RED ? PIECES.BLACK : PIECES.RED,
      selectedPieceLock: false,
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
    if (
      col2 > board[0].length - 1 ||
      col2 < 0 ||
      row2 > board.length - 1 ||
      row2 < 0
    )
      return false; // Can't move off the board

    if (!this.isSpaceAvailable(row2, col2, board)) return false; // Can't move to a filled space

    if (Math.abs(row1 - row2) != 2 || Math.abs(col1 - col2) != 2) return false; // Can't capture if not moving 2 spaces

    const rowMid = row1 + (row2 - row1) / 2;
    const colMid = col1 + (col2 - col1) / 2;

    const piece1 = board[row1][col1];
    const piece2 = board[rowMid][colMid];

    if (piece2 == null) return false; // No piece to capture
    if (piece2.startsWith(piece1) || piece1.startsWith(piece2)) return false; // Can't capture own piece

    return true; // Move contains a capturable piece
  };

  hasAnyCapturablePieces = (row, col, board) => {
    const redDirections =
      this.hasCapturablePiece(row, col, row - 2, col - 2, board) || // Up left
      this.hasCapturablePiece(row, col, row - 2, col + 2, board); // Up right

    const blackDirections =
      this.hasCapturablePiece(row, col, row + 2, col - 2, board) || // Down left
      this.hasCapturablePiece(row, col, row + 2, col + 2, board); // Down Right

    const allDirections = redDirections || blackDirections;

    const piece = board[row][col];

    if (piece === PIECES.BLACK_KING || piece === PIECES.RED_KING)
      return allDirections; // Kings can move in all directions

    if (piece === PIECES.RED) return redDirections; // Red pieces can only move up

    if (piece === PIECES.BLACK) return blackDirections; // Black pieces can only move down

    return false;
  };

  // Checks if the move is a valid distance (1 or 2 spaces, depending on if a capturable piece exists)
  isValidDistance = (row1, col1, row2, col2, board) => {
    return (
      this.hasCapturablePiece(row1, col1, row2, col2, board) ||
      Math.abs(row1 - row2) === 1
    );
  };

  // Gets the text for the checkers game updates (winner or turn)
  getCheckersUpdateText = () => {
    let num = this.state.turn == PIECES.RED ? 1 : 2;

    if (this.state.winner != null) {
      return "Player " + num + " Wins!";
    }
    return "Player " + num + "\'s Turn";
  };

  // Gets the color for the turn
  getTurnColor = () => {
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
                          !this.state.selectedPieceLock &&
                          piece.startsWith(this.state.turn)
                        ) {
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
    fontSize: 25,
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
