const fs = require('fs');
const csv = require('fast-csv');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

/*
-----------------------------------------------
  File System Read Stream for Each Csv
-----------------------------------------------
*/
let statesStream;
let citiesStream;
let categoriesStream;
let usersStream;
let authStream;
let advertisesStream;
let imagesStream;
let resetPasswordStream;

if (process.env.NODE_ENV === 'production'){
  statesStream = fs.createReadStream("./csv/states.csv");
  citiesStream = fs.createReadStream("./csv/cities.csv");
  categoriesStream = fs.createReadStream("./csv/categories.csv");
  usersStream = fs.createReadStream("./csv/users.csv");
  authStream = fs.createReadStream("./csv/auth.csv");
  advertisesStream = fs.createReadStream("./csv/advertises.csv");
  imagesStream = fs.createReadStream('./csv/images.csv');
  resetPasswordStream = fs.createReadStream('./csv/reset_password.csv');
} else {
  statesStream = fs.createReadStream("./csv/testcsv/states.csv");
  citiesStream = fs.createReadStream("./csv/testcsv/cities.csv");
  categoriesStream = fs.createReadStream("./csv/testcsv/categories.csv");
  usersStream = fs.createReadStream("./csv/testcsv/users.csv");
  authStream = fs.createReadStream("./csv/testcsv/auth.csv");
  advertisesStream = fs.createReadStream("./csv/testcsv/advertises.csv");
  imagesStream = fs.createReadStream('./csv/testcsv/images.csv');
  resetPasswordStream = fs.createReadStream('./csv/testcsv/reset_password.csv');
}

/*
-----------------------------------------------
  Parse States Csv
-----------------------------------------------
*/
exports.parseStates = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(statesStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push(data.state_name)
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse Cities Csv
-----------------------------------------------
*/
exports.parseCities = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(citiesStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push({
        cityStateId: data.city_state_id,
        cityName: data.city_name
      })
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse Categories Csv
-----------------------------------------------
*/
exports.parseCategories = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(categoriesStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push(data.category_name)
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse Users Csv
-----------------------------------------------
*/
exports.parseUsers = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(usersStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push({
        userName: data.user_name,
        userPhoneNumber: data.user_phone,
        userEmail: data.user_email
      })
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse Auth Csv
-----------------------------------------------
*/
exports.parseAuth = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(authStream, { headers: true })
    .on("data", (data) => {
      if (data.auth_password) {
        parsedArray.push({
          authUserId: data.auth_user_id,
          authType: data.auth_type,
          authPassword: bcrypt.hashSync(data.auth_password, saltRounds)
        })
      } else {
        parsedArray.push({
          authUserId: data.auth_user_id,
          authType: data.auth_type,
          authPassword: data.auth_password
        })
      }
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse Advertises Csv
-----------------------------------------------
*/
exports.parseAdvertises = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(advertisesStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push({
        advertiseUserId: data.advertise_user_id,
        advertiseTitle: data.advertise_title,
        advertiseDescription: data.advertise_description,
        advertisePrice: data.advertise_price,
        advertiseCondition: data.advertise_condition,
        advertiseCategoryId: data.advertise_category_id,
        advertiseLatitude: data.advertise_latitude,
        advertiseLongitude: data.advertise_longitude,
        advertiseTimestamp: data.advertise_timestamp,
        advertiseSold: data.advertise_sold,
        advertiseCityId: data.advertise_city_id,
        advertiseStage: data.advertise_stage
      })
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse Images Csv
-----------------------------------------------
*/
exports.parseImages = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(imagesStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push({
        imagePath: data.image_path,
        imageAdvertiseId: data.image_advertise_id
      })
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};

/*
-----------------------------------------------
  Parse reset_password Csv
-----------------------------------------------
*/
exports.parseResetPassword = () => {
  const parsedArray = [];
  return new Promise((resolve) => {
    csv
    .fromStream(resetPasswordStream, { headers: true })
    .on("data", (data) => {
      parsedArray.push({
        resetId: data.reset_id,
        resetUserEmail: data.reset_user_email,
        resetToken: data.reset_token,
        resetTimestamp: data.reset_timestamp
      })
    })
    .on("end", function(){
      resolve(parsedArray);
    });
  })
};
