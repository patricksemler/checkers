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
      [null, "black", null, "black", null, "black", null, "black"],
      ["black", null, "black", null, "black", null, "black", null],
      [null, "black", null, "black", null, "black", null, "black"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["red", null, "red", null, "red", null, "red", null],
      [null, "red", null, "red", null, "red", null, "red"],
      ["red", null, "red", null, "red", null, "red", null],
    ],

    turn: "red",
    selectedPiece: { row: null, col: null },
  };

  movePiece = (row1, col1, row2, col2) => {
    if (!this.isValidMove(row1, col1, row2, col2)) return;

    let capturablePiece = this.hasCapturablePiece(row1, col1, row2, col2);

    const newBoard = JSON.parse(JSON.stringify(this.state.board));
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = this.state.turn;

    if (capturablePiece) {
      console.log("Capturing piece");
      newBoard[row1 + (row2 - row1) / 2][col1 + (col2 - col1) / 2] = null;
    } else {
      console.log("No capture");
    }

    this.setState({ board: newBoard, selectedPiece: { row: null, col: null } });

    this.switchTurn();
  };

  switchTurn = () =>
    this.setState((state) => ({
      turn: state.turn === "red" ? "black" : "red",
    }));

  isValidMove = (row1, col1, row2, col2) => {
    let correctTurn = this.isCorrectTurn(row1, col1);
    let spaceAvailable = this.isSpaceAvailable(row2, col2);
    let diagonal = this.isDiagonal(row1, col1, row2, col2);
    let directional = this.isDirectional(row1, row2);
    let withinBounds = this.isWithinBounds(row1, row2, col1, col2);

    if (!correctTurn) {
      console.log("Incorrect turn");
      return false;
    }

    if (!spaceAvailable) {
      console.log("Space is not available");
      return falses;
    }

    if (!diagonal) {
      console.log("Move is not diagonal");
      return false;
    }

    if (!directional) {
      console.log("Move is not directional");
      return false;
    }

    if (!withinBounds) {
      console.log("Move is out of bounds");
      return false;
    }

    return true;
  };

  isCorrectTurn = (row, col) => {
    return this.state.board[row][col] === this.state.turn;
  };

  isSpaceAvailable = (row, col) => {
    return this.state.board[row][col] === null;
  };

  isDiagonal = (row1, col1, row2, col2) => {
    return Math.abs(row2 - row1) === Math.abs(col2 - col1);
  };

  isDirectional = (row1, row2) => {
    if (this.state.turn === "red") {
      return row2 - row1 <= -1;
    } else {
      return row2 - row1 >= 1;
    }
  };

  isWithinBounds = (row1, row2, col1, col2) => {
    return Math.abs(row1 - row2) <= 2 && Math.abs(col1 - col2) <= 2;
  };

  hasCapturablePiece = (row1, col1, row2, col2) => {
    if (Math.abs(row1 - row2) != 2 || Math.abs(col1 - col2) != 2) return false;

    rowDifference = (row2 - row1) / 2;
    colDifference = (col2 - col1) / 2;

    let piece1 = this.state.board[row1][col1];
    let piece2 = this.state.board[row1 + rowDifference][col1 + colDifference];

    if (piece2 == null) return false;
    if (piece2 == piece1) return false;

    return true;
  };

  render() {
    return (
      <View style={styles.container}>
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
                  underlayColor={"grey"}
                  onPress={() => {
                    if (piece && piece == this.state.turn) {
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
                        {piece === "red" ? "🔴" : "⚫"}
                      </Text>
                    )}
                  </View>
                </TouchableHighlight>
              ))}
            </View>
          ))}
        </View>

        <StatusBar style="auto" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: deviceHeight,
    width: deviceWidth,
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
    borderColor: "grey",
  },
  pieceView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  piece: {
    fontSize: 24,
  },
});
