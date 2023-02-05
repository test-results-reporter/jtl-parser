const { jtlParser } = require("./main");
var args = process.argv.slice(2);
jtlParser(args[0], args[1]);

process.on(`uncaughtException`, (err) => {
  console.log(`Server | Uncaught Exception happened - ${err.message}`);
  process.exit(1);
});
