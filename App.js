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

export default class App extends Component {
  state = {
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, "black", null, "blackKing", null, null],
      [null, null, null, null, "redKing", null, null, null],
      [null, "red", null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],

    turn: "red",
    winner: null,
    selectedPiece: { row: null, col: null },
  };

  movePiece = (row1, col1, row2, col2) => {
    if (!this.isValidMove(row1, col1, row2, col2)) return;

    let capturablePiece = this.hasCapturablePiece(row1, col1, row2, col2);

    const newBoard = JSON.parse(JSON.stringify(this.state.board));
    let piece = newBoard[row1][col1];
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = piece;

    if (capturablePiece) {
      console.log("Capturing piece");
      newBoard[row1 + (row2 - row1) / 2][col1 + (col2 - col1) / 2] = null;
    } else {
      console.log("No capture");
    }

    for (let i = 0; i < newBoard[0].length; i++) {
      if (newBoard[0][i] == "red") newBoard[0][i] = "redKing";
    }

    for (let i = 0; i < newBoard[7].length; i++) {
      if (newBoard[7][i] == "black") newBoard[7][i] = "blackKing";
    }

    const flattenedBoard = newBoard.flat();
    let newWinner = null;
    if (!(flattenedBoard.includes("red") || flattenedBoard.includes("redKing")))
      newWinner = "black";
    else if (
      !(
        flattenedBoard.includes("black") || flattenedBoard.includes("blackKing")
      )
    )
      newWinner = "red";

    this.setState({
      board: newBoard,
      selectedPiece: { row: null, col: null },
      winner: newWinner,
    });

    if (newWinner != null) return;

    this.switchTurn();
  };

  switchTurn = () =>
    this.setState((state) => ({
      turn: state.turn == "red" ? "black" : "red",
    }));

  isValidMove = (row1, col1, row2, col2) => {
    let correctTurn = this.isCorrectTurn(row1, col1);
    let spaceAvailable = this.isSpaceAvailable(row2, col2);
    let diagonal = this.isDiagonal(row1, col1, row2, col2);
    let directional = this.isDirectional(row1, col1, row2);
    let validDistance = this.isValidDistance(row1, col1, row2, col2);

    if (this.state.winner != null) {
      return false;
    }

    if (!correctTurn) {
      console.log("Incorrect turn");
      return false;
    }

    if (!spaceAvailable) {
      console.log("Space is not available");
      return false;
    }

    if (!diagonal) {
      console.log("Move is not diagonal");
      return false;
    }

    if (!directional) {
      console.log("Move is not directional");
      return false;
    }

    if (!validDistance) {
      console.log("Move is not valid distance");
      return false;
    }

    return true;
  };

  isCorrectTurn = (row, col) => {
    return (
      this.state.winner == null &&
      this.state.board[row][col].startsWith(this.state.turn)
    );
  };

  isSpaceAvailable = (row, col) => {
    return this.state.board[row][col] === null;
  };

  isDiagonal = (row1, col1, row2, col2) => {
    return Math.abs(row2 - row1) === Math.abs(col2 - col1);
  };

  isDirectional = (row1, col1, row2) => {
    let piece = this.state.board[row1][col1];

    if (piece === "red") {
      return row2 - row1 <= -1;
    } else if (piece === "black") {
      return row2 - row1 >= 1;
    } else {
      return Math.abs(row2 - row1) >= 1;
    }
  };

  hasCapturablePiece = (row1, col1, row2, col2) => {
    if (Math.abs(row1 - row2) != 2 || Math.abs(col1 - col2) != 2) return false;

    rowDifference = (row2 - row1) / 2;
    colDifference = (col2 - col1) / 2;

    let piece1 = this.state.board[row1][col1];
    let piece2 = this.state.board[row1 + rowDifference][col1 + colDifference];

    if (piece2 == null) return false;
    if (piece2.startsWith(piece1) || piece1.startsWith(piece2)) return false;

    return true;
  };

  isValidDistance = (row1, col1, row2, col2) => {
    return (
      this.hasCapturablePiece(row1, col1, row2, col2) ||
      Math.abs(row1 - row2) == 1
    );
  };

  getPieceEmojiText = (piece) => {
    if (piece == "red") return "🔴";
    if (piece == "redKing") return "🟥";
    if (piece == "black") return "⚫";
    if (piece == "blackKing") return "⬛️";
  };

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
                          (rowIndex + colIndex) % 2 == 0 ? "white" : "black",
                        borderWidth:
                          this.state.selectedPiece.row === rowIndex &&
                          this.state.selectedPiece.col === colIndex
                            ? 2
                            : 0,
                      },
                    ]}
                    underlayColor={"#d4af37"}
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
            style={[
              styles.checkersUpdateText,
              { color: this.state.turn == "red" ? "red" : "black" },
            ]}
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
  },
  mainMenuScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chessScreen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    height: 200,
    width: 200,
    backgroundColor: "blue",
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
    borderColor: "#d4af37",
  },
  piece: {
    fontSize: 24,
    textShadowColor: "grey",
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
