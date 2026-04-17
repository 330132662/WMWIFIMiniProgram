class LogModel {
  constructor() {
    this.state = 0;
    this.log = '';
  }
  setLog(log) {
    this.log = log;
  }
  setState(state) {
    this.state = state;
  }
}
module.exports = LogModel