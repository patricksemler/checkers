import React, { Component } from 'react';
import { AppRegistry, Text, View, StyleSheet, Image, TextInput, ImageBackground, TouchableHighlight, Alert, Dimensions, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';

let deviceHeight = Dimensions.get('window').height;
let deviceWidth = Dimensions.get('window').width;

export default class App extends Component {
  state = {
    board: [
      [null, 'black', null, 'black', null, 'black', null, 'black'],
      ['black', null, 'black', null, 'black', null, 'black', null],
      [null, 'black', null, 'black', null, 'black', null, 'black'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['red', null, 'red', null, 'red', null, 'red', null],
      [null, 'red', null, 'red', null, 'red', null, 'red'],
      ['red', null, 'red', null, 'red', null, 'red', null],
    ],

    turn: 'red',
  }

  movePiece = (row1, col1, row2, col2) => {
    if (!this.isValidMove(row1, col1, row2, col2)) return;

    console.log(this.state.board);

    const newBoard = JSON.parse(JSON.stringify(this.state.board));
    newBoard[row1][col1] = null;
    newBoard[row2][col2] = this.state.turn;

    this.setState({ board: newBoard });

    this.switchTurn();

    console.log(this.state.board);
  };

  switchTurn = () => this.setState(state => ({
    turn: state.turn === 'red' ? 'black' : 'red',
  }));

  isValidMove = (row1, col1, row2, col2) => {
    let spaceAvailable = this.isSpaceAvailable(row2, col2);
    let diagonal = this.isDiagonal(row1, col1, row2, col2);
    let directional = this.isDirectional(row1, row2);

    if (!spaceAvailable) {
      console.log('Space is not available');
      return false;
    }

    if (!diagonal) {  
      console.log('Move is not diagonal');
      return false;
    }

    if (!directional) {
      console.log('Move is not directional');
      return false;
    }

    return true;
  };

  isSpaceAvailable = (row, col) => {
    return this.state.board[row][col] === null;;
  };

  isDiagonal = (row1, col1, row2, col2) => {
    return (Math.abs(row2 - row1) === 1) && (Math.abs(col2 - col1) === 1)
  };

  isDirectional = (row1, row2) => {
    if (this.state.turn === 'red') {
      return (row2 - row1 === -1);
    } else {
      return (row2 - row1 === 1);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.board}>
          {this.state.board.map((row, rowIndex) => (
            <View style={styles.row}>
              {row.map((piece, colIndex) => (
                <View 
                  style={[styles.square, 
                    {backgroundColor: (rowIndex + colIndex) % 2 == 0 ? 'white' : 'black'}
                  ]}
                >
                  {piece && (
                    <TouchableHighlight>
                      <Text style={styles.piece}>
                        {piece === 'red' ? '🔴' : '⚫'}
                      </Text>
                    </TouchableHighlight>
                  )}

                </View>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    height: 200,
    width: 200,
    backgroundColor: 'blue',
  },
  buttonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  board: {
    width: deviceWidth * 8 / 10,
    height: deviceWidth * 8 / 10,
    flexDirection: 'column',
    borderColor: 'black',
    borderWidth: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  square: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    fontSize: 24,
  },
});