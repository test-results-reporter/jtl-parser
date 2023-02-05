const fs = require("fs");
const path = require("path");
const inputDirectory = "tests",
  outputDirectory = "results";
let results = {};
const ApdexThreshold = 500;

const _getRequiredFields = (record) => {
  const row = record.split(",");
  return {
    timeStamp: row[0],
    elapsedTime: row[1],
    aggLabel: row[2],
    statusCode: row[3],
  };
};

const _addANewAggLabel = (aggLabel) => {
  if (!results[aggLabel]) {
    results[aggLabel] = {
      label: aggLabel,
      error_count: 0,
      request_count: 0,
      max_time: Number.MIN_VALUE,
      min_time: Number.MAX_VALUE,
      total_response_time: 0,
      elapsed_times: [],
      satisfied: 0,
      tolerating: 0,
      frustrated: 0,
    };
  }
};

const _setUserSatisfactionLevel = (aggLabel, elapsedTime) => {
  if (elapsedTime <= ApdexThreshold) return ++results[aggLabel].satisfied;
  else if (elapsedTime <= 4 * ApdexThreshold)
    return ++results[aggLabel].tolerating;
  else return ++results[aggLabel].frustrated;
};

const _processData = (record) => {
  const row = _getRequiredFields(record);
  _addANewAggLabel(row.aggLabel);
  ++results[row.aggLabel].request_count;
  if (row.statusCode !== 200) {
    ++results[row.aggLabel].error_count;
  }

  results[row.aggLabel].max_time = Math.max(
    results[row.aggLabel].max_time,
    row.elapsedTime
  );
  results[row.aggLabel].min_time = Math.min(
    results[row.aggLabel].min_time,
    row.elapsedTime
  );
  results[row.aggLabel].total_response_time += row.elapsedTime;
  results[row.aggLabel].elapsed_times.push(row.elapsedTime);
  _setUserSatisfactionLevel(row.aggLabel, row.elapsedTime);
};

const _readAndProcessInputStreamFromSource = async (sourceFile, destFile) => {
  const readStream = fs.createReadStream(sourceFile);
  readStream.setEncoding("UTF8");
  try {
    console.log(`I am in read stream....`);
    readStream.on("data", (dataChunk) => {
      const inputDataStream = dataChunk.split("\n");
      for (let i = 0; i < inputDataStream.length; i++) {
        _processData(inputDataStream[i]);
      }
    });
    readStream.on("end", () => {
      console.log(`end of reading...`);
      readStream.close();
      _summariseAndCalculatePercentile();
      _writeToOutputStream(destFile);
    });
  } catch (err) {
    console.log(`error occured while reading using stream: ${err.message}`);
    readStream.close();
    throw err;
  }
};

const _calculatePercentile = (elapsedTimes, percentile) => {
  var divisor = (100 - percentile) / 100;
  elapsedTimes.sort(function (a, b) {
    return b - a;
  });
  var xPercent = parseInt(Math.ceil(elapsedTimes.length * divisor));
  return elapsedTimes.slice(0, xPercent).slice(-1)[0];
};

const _summariseAndCalculatePercentile = () => {
  if (results && Object.keys(results).length > 0) {
    for (const label of Object.keys(results)) {
      results[label].mean_response_time_millis = +(
        results[label].total_response_time / results[label].request_count
      ).toFixed(2);
      // not sure of the below elapsed time
      results[label].elapsed_time_millis =
        results[label].max_time - results[label].min_time;
      results[label].mean_request_per_sec = +(
        (1000 * results[label].request_count) /
        results[label].elapsed_time_millis
      ).toFixed(2);
      results[label].apdexThreshold = +(
        (results[label].satisfied + results[label].tolerating / 2) /
        results[label].request_count
      ).toFixed(2);
      results[label].error_percentage = +(
        results[label].error_count / results[label].request_count
      ).toFixed(2);

      results[label].p50_percentile = _calculatePercentile(
        results[label].elapsed_times,
        50
      );
      results[label].p90_percentile = _calculatePercentile(
        results[label].elapsed_times,
        90
      );
      results[label].p99_percentile = _calculatePercentile(
        results[label].elapsed_times,
        99
      );
    }
  }
};

const _writeToOutputStream = async (targetFile) => {
  const writeStream = fs.createWriteStream(
    path.join("../", outputDirectory, targetFile)
  );
  try {
    console.log(`I am in write stream....`);
    const keys = [
      "label",
      "request_count",
      "mean_response_time_millis",
      "max_time",
      "min_time",
      "error_percentage",
      "apdexThreshold",
      "satisfied",
      "tolerating",
      "frustrated",
      "p50_percentile",
      "p90_percentile",
      "p99_percentile",
    ];
    writeStream.write(keys.join(",") + "\n");
    for (const key of Object.keys(results)) {
      let values = keys.map((k) => {
        return results[key][k];
      });

      const overWaterMark = writeStream.write(values.join(",") + "\n");
      if (!overWaterMark) {
        await new Promise((resolve) => writeStream.once("drain", resolve));
      }
    }
    writeStream.end();
    console.log(`end of writing...`);
  } catch (err) {
    console.log(`error occured while writing stream: ${err.message}`);
    writeStream.close();
    throw err;
  }
};

module.exports = {
  jtlParser: async (inputFileName, outputFileName) => {
    try {
      console.log("Started the program ......");
      await _readAndProcessInputStreamFromSource(
        path.join("../", inputDirectory, inputFileName),
        outputFileName
      );
    } catch (err) {
      console.log(`error occured: ${err.message}`, { err });
      throw err;
    } finally {
      console.log("End of the program......");
    }
  },
};
