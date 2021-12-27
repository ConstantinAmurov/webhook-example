const afterCreateBooking = (data, callback) => {
    console.log(data);
    callback(null, {});
};

const afterUpdateBooking = (data, callback) => {
    console.log(data);
    callback(null, {});
};

const afterDeleteBooking = (data, callback) => {
    console.log(data);
    callback(null, {});
};

module.exports = {
    afterCreateBooking,
    afterUpdateBooking,
    afterDeleteBooking
};